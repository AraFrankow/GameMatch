const Stripe = require('stripe');
const { Usuario } = require('../models');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const crearCheckoutSession = async (req, res) => {
  try {
    const usuario = req.usuario;

    if (!usuario) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173';

    const sessionConfig = {
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'GameMatch Premium',
              description: 'Acceso a filtros avanzados y beneficios exclusivos.',
            },
            unit_amount: 499, // $4.99 USD
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      metadata: {
        usuario_id: String(usuario.id),
      },
      success_url: `${clientUrl}?pago=exito&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}?pago=cancelado`,
    };

    if (usuario.stripe_customer_id) {
      sessionConfig.customer = usuario.stripe_customer_id;
    } else {
      sessionConfig.customer_email = usuario.email || 'usuario_test@gamematch.com';
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return res.json({ url: session.url });
  } catch (error) {
    console.error('Error en Stripe Checkout:', error);
    return res.status(500).json({ error: error.message || 'Error al iniciar el pago' });
  }
};

const confirmarPago = async (req, res) => {
  try {
    const { session_id } = req.body;
    if (!session_id) return res.status(400).json({ error: 'Falta session_id' });

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === 'paid') {
      const usuarioId = Number(session.metadata.usuario_id);

      await Usuario.update(
        { 
          es_premium: 1,
          cancel_at_period_end: 0,
          stripe_subscription_id: session.subscription,
          stripe_customer_id: session.customer
        }, 
        { where: { id: usuarioId } }
      );

      return res.json({ exito: true, mensaje: '¡Suscripción activada con éxito!' });
    } else {
      return res.status(400).json({ error: 'El pago no fue completado.' });
    }
  } catch (error) {
    console.error('Error al confirmar pago:', error);
    return res.status(500).json({ error: error.message || 'Error al verificar el pago' });
  }
};

const cancelarSuscripcion = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const usuario = await Usuario.findByPk(usuarioId);

    if (!usuario) {
      return res.status(404).json({ exito: false, error: 'Usuario no encontrado' });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    let fechaFin = null;

    if (usuario.stripe_subscription_id) {
      const suscripcion = await stripe.subscriptions.update(usuario.stripe_subscription_id, {
        cancel_at_period_end: true,
      });

      fechaFin = new Date(suscripcion.current_period_end * 1000).toLocaleDateString();
    }

    usuario.es_premium = true;
    usuario.cancel_at_period_end = true;
    await usuario.save();

    return res.json({
      exito: true,
      mensaje: 'La renovación automática ha sido desactivada.',
      usuario: {
        id: usuario.id,
        username: usuario.username,
        es_premium: true,
        cancel_at_period_end: true,
        fecha_fin: fechaFin
      }
    });
  } catch (error) {
    console.error('Error al cancelar suscripción:', error);
    return res.status(500).json({ exito: false, error: 'Error al cancelar la suscripción' });
  }
};

const webhookStripe = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let evento;

  try {
    evento = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`Error de Webhook: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (evento.type) {
    case 'customer.subscription.deleted': {
      const subscription = evento.data.object;
      await Usuario.update(
        { es_premium: 0, stripe_subscription_id: null },
        { where: { stripe_subscription_id: subscription.id } }
      );
      console.log(`Suscripción ${subscription.id} expirada. Premium desactivado.`);
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = evento.data.object;
      if (invoice.subscription) {
        await Usuario.update(
          { es_premium: 1 },
          { where: { stripe_customer_id: invoice.customer } }
        );
      }
      break;
    }
  }

  return res.json({ recibido: true });
};

module.exports = { 
  crearCheckoutSession, 
  confirmarPago, 
  cancelarSuscripcion,
  webhookStripe
};