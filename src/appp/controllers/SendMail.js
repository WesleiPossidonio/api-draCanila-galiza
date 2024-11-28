import * as yup from 'yup';
import nodemailer from 'nodemailer';
import mjml2html from 'mjml';
import { google } from 'googleapis';

const OAuth2 = google.auth.OAuth2;

let emailTransporter; // Variável para armazenar o transporter em cache

const createTransporter = async () => {
  // Verifica se o transporter já foi criado
  if (!emailTransporter) {
    try {
      const oauth2Client = new OAuth2(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
        "https://developers.google.com/oauthplayground"
      );

      oauth2Client.setCredentials({
        refresh_token: process.env.REFRESH_TOKEN,
      });

      const accessToken = await oauth2Client.getAccessToken();

      emailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: process.env.EMAIL,
          accessToken,
          clientId: process.env.CLIENT_ID,
          clientSecret: process.env.CLIENT_SECRET,
          refreshToken: process.env.REFRESH_TOKEN,
        },
      });
    } catch (error) {
      console.error('Erro ao criar o transportador:', error);
      throw error;
    }
  }
  
  return emailTransporter;
};

class SendEmail {
  async store(request, response) {
    const schema = yup.object().shape({
      name: yup.string().required(),
      subject_title: yup.string().required(),
      subject_text: yup.string().required(),
      email: yup.string().email().required(),
      phone: yup.string().required(),
    });

    const { name, email, subject_title, phone, subject_text } = request.body;

    try {
      await schema.validate(request.body, { abortEarly: false });
    } catch (error) {
      return response.status(400).json({ error: 'Dados do formulário inválidos.' });
    }

    const mjmlCode = `
      <mjml>
        <mj-body background-color="#fff" color="#55575d" font-family="Arial, sans-serif">
          <mj-section background-color="#f2f2f2" padding="20px 0" text-align="center">
            <mj-column>
              <mj-image align="center" padding="10px 25px" src="your-image-url-here" width="128px"></mj-image>
            </mj-column>
          </mj-section>
          <mj-section background-color="#f2f2f2" padding="0px 0px 20px 0px" text-align="center">
            <mj-column>
              <mj-text>
                <h2>Nome: ${name}</h2>
                <h2>Telefone: ${phone}</h2>
              </mj-text>
              <mj-text>
                <p>${subject_text}</p>
              </mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `;

    let html;
    try {
      const { html: convertedHtml } = mjml2html(mjmlCode);
      html = convertedHtml;
    } catch (error) {
      console.error('Erro ao converter o MJML em HTML:', error);
      return response.status(500).json({ error: 'Erro ao processar o template de e-mail.' });
    }

    const sendEmail = async (emailOptions) => {
      let emailTransporter = await createTransporter(); // Chama a função para obter o transporter
      await emailTransporter.sendMail(emailOptions);
    };

    const mailOptions = {
      from: `"${name}" <${process.env.EMAIL}>`,
      to: 'comercial@gaspartransportes.com.br',
      subject: subject_title,
      html,
      headers: {
        'X-Mailer': 'MeuApp',
        'Reply-To': email,
      },
    };

    try {
      await sendEmail(mailOptions);
      return response.status(200).json({ success: 'E-mail enviado com sucesso.' });
    } catch (error) {
      console.error('Erro ao enviar o e-mail:', error);
      return response.status(500).json({ error: 'Erro ao enviar o e-mail.' });
    }
  }
}

export default new SendEmail();
