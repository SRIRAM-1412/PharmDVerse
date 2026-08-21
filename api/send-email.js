import pg from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.ngfgwgwofnuwqrbmvtuo:xaSPYQPLysXv2rbo@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { notificationId } = req.body || {};
  if (!notificationId) {
    return res.status(400).json({ error: 'Missing notificationId parameter' });
  }

  const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();

    // 1. Fetch notification record directly from database
    const notifRes = await client.query(`
      SELECT * FROM public.notifications WHERE id = $1;
    `, [notificationId]);

    if (notifRes.rows.length === 0) {
      await client.end();
      return res.status(404).json({ error: 'Notification record not found' });
    }

    const notif = notifRes.rows[0];

    // 2. IDEMPOTENCY CHECK: Do not resend if already sent
    if (notif.email_sent === true || notif.email_delivery_status === 'Sent') {
      await client.end();
      return res.status(200).json({
        success: true,
        alreadySent: true,
        message: 'Notification email already delivered previously.'
      });
    }

    // 3. Resolve recipient email from trusted database records (not client-supplied inputs)
    let recipientEmail = notif.email_recipient;
    let recipientName = 'User';

    if (notif.recipient_role === 'Student') {
      const studRes = await client.query('SELECT full_name, email FROM public.students WHERE id = $1;', [notif.recipient_user_id]);
      if (studRes.rows.length > 0) {
        recipientEmail = studRes.rows[0].email;
        recipientName = studRes.rows[0].full_name;
      }
    } else if (notif.recipient_role === 'Preceptor') {
      const precRes = await client.query('SELECT full_name, email FROM public.preceptors WHERE id = $1;', [notif.recipient_user_id]);
      if (precRes.rows.length > 0) {
        recipientEmail = precRes.rows[0].email;
        recipientName = precRes.rows[0].full_name;
      }
    }

    if (!recipientEmail || !recipientEmail.trim()) {
      await client.query(`
        UPDATE public.notifications
        SET email_sent = false, email_delivery_status = 'Failed', email_error_message = 'No valid recipient email address found'
        WHERE id = $1;
      `, [notificationId]);
      await client.end();
      return res.status(400).json({ error: 'No valid recipient email address found' });
    }

    // 4. Construct Email Content
    const emailSubject = `PharmDVerse: ${notif.title}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="background-color: #0f172a; padding: 16px 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h2 style="color: #10b981; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px;">PHARMDVERSE ERP</h2>
          <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 11px; font-weight: 600; text-transform: uppercase;">Clinical Pharmacy Workflow Update</p>
        </div>
        <div style="padding: 24px 20px; background-color: #f8fafc;">
          <p style="font-size: 14px; color: #334155; margin-top: 0;">Hello <strong>${recipientName}</strong>,</p>
          <div style="background-color: #ffffff; padding: 16px; border-radius: 8px; border: 1px solid #cbd5e1; margin-bottom: 20px;">
            <h3 style="margin: 0 0 8px 0; color: #0f172a; font-size: 16px;">${notif.title}</h3>
            <p style="margin: 0; color: #475569; font-size: 13px; white-space: pre-line; line-height: 1.5;">${notif.message}</p>
          </div>
          <div style="text-align: center; margin-top: 24px;">
            <a href="https://pharmdverse.com/login" style="background-color: #10b981; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px; display: inline-block;">Log in to PharmDVerse</a>
          </div>
        </div>
        <div style="padding: 12px 20px; background-color: #f1f5f9; text-align: center; font-size: 11px; color: #64748b; border-radius: 0 0 8px 8px;">
          This is an automated educational clinical workflow notification from PharmDVerse ERP.
        </div>
      </div>
    `.trim();

    // 5. Deliver via Resend API (using process.env.RESEND_API_KEY server-side)
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.SENDER_EMAIL || 'notifications@pharmdverse.com';

    let deliverySuccess = false;
    let errorMessage = null;

    if (apiKey) {
      const apiRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [recipientEmail],
          subject: emailSubject,
          html: emailHtml
        })
      });

      const resData = await apiRes.json();
      if (apiRes.ok && resData.id) {
        deliverySuccess = true;
      } else {
        errorMessage = resData.message || JSON.stringify(resData);
      }
    } else {
      errorMessage = 'RESEND_API_KEY environment secret is not configured on the server.';
      console.warn('⚠️ [Server Email Warning] RESEND_API_KEY missing from server environment variables.');
    }

    // 6. Record delivery status in database
    const nowIso = new Date().toISOString();
    if (deliverySuccess) {
      await client.query(
        'UPDATE public.notifications SET email_sent = true, email_sent_at = $1, email_delivery_status = $2, email_error_message = NULL, email_recipient = $3 WHERE id = $4',
        [nowIso, 'Sent', recipientEmail, notificationId]
      );
      await client.end();
      return res.status(200).json({ success: true, email_delivery_status: 'Sent' });
    } else {
      await client.query(
        'UPDATE public.notifications SET email_sent = false, email_delivery_status = $1, email_error_message = $2, email_recipient = $3 WHERE id = $4',
        ['Failed', errorMessage, recipientEmail, notificationId]
      );
      await client.end();
      return res.status(200).json({ success: false, email_delivery_status: 'Failed', error: errorMessage });
    }

  } catch (err) {
    console.error('Error executing send-email serverless handler:', err);
    try {
      await client.query(`
        UPDATE public.notifications
        SET email_sent = false, email_delivery_status = 'Failed', email_error_message = $1
        WHERE id = $2;
      `, [err.message, notificationId]);
      await client.end();
    } catch (e) {
      // Ignore cleanup error
    }
    return res.status(500).json({ success: false, error: err.message });
  }
}
