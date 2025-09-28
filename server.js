import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { 
  sendVerificationEmail, 
  sendWelcomeEmail, 
  sendPasswordResetEmail, 
  sendResetSuccessEmail 
} from './mailtrap/email.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Rota de saúde da API
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Mailtrap API está funcionando',
    timestamp: new Date().toISOString()
  });
});

// Rota para enviar e-mail de verificação
app.post('/api/send-verification-email', async (req, res) => {
  try {
    const { email, verificationToken } = req.body;

    // Validação dos campos obrigatórios
    if (!email || !verificationToken) {
      return res.status(400).json({
        error: 'Email e verificationToken são obrigatórios'
      });
    }

    await sendVerificationEmail(email, verificationToken);

    res.json({
      success: true,
      message: 'E-mail de verificação enviado com sucesso',
      email: email
    });

  } catch (error) {
    console.error('Erro no servidor:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor ao enviar e-mail de verificação',
      details: error.message
    });
  }
});

// Rota para enviar e-mail de boas-vindas
app.post('/api/send-welcome-email', async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email || !name) {
      return res.status(400).json({
        error: 'Email e name são obrigatórios'
      });
    }

    await sendWelcomeEmail(email, name);

    res.json({
      success: true,
      message: 'E-mail de boas-vindas enviado com sucesso',
      email: email,
      name: name
    });

  } catch (error) {
    console.error('Erro no servidor:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor ao enviar e-mail de boas-vindas',
      details: error.message
    });
  }
});

// Rota para enviar e-mail de redefinição de senha
app.post('/api/send-password-reset-email', async (req, res) => {
  try {
    const { email, resetURL } = req.body;

    if (!email || !resetURL) {
      return res.status(400).json({
        error: 'Email e resetURL são obrigatórios'
      });
    }

    await sendPasswordResetEmail(email, resetURL);

    res.json({
      success: true,
      message: 'E-mail de redefinição de senha enviado com sucesso',
      email: email
    });

  } catch (error) {
    console.error('Erro no servidor:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor ao enviar e-mail de redefinição de senha',
      details: error.message
    });
  }
});

// Rota para enviar e-mail de sucesso na redefinição de senha
app.post('/api/send-reset-success-email', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email é obrigatório'
      });
    }

    await sendResetSuccessEmail(email);

    res.json({
      success: true,
      message: 'E-mail de sucesso na redefinição enviado com sucesso',
      email: email
    });

  } catch (error) {
    console.error('Erro no servidor:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor ao enviar e-mail de sucesso na redefinição',
      details: error.message
    });
  }
});

// Rota para enviar múltiplos e-mails (exemplo de uso em lote)
app.post('/api/send-batch-emails', async (req, res) => {
  try {
    const { emails } = req.body;

    if (!emails || !Array.isArray(emails)) {
      return res.status(400).json({
        error: 'Emails deve ser um array de objetos com email e tipo'
      });
    }

    const results = [];
    
    for (const emailData of emails) {
      try {
        switch (emailData.type) {
          case 'verification':
            await sendVerificationEmail(emailData.email, emailData.verificationToken);
            break;
          case 'welcome':
            await sendWelcomeEmail(emailData.email, emailData.name);
            break;
          case 'password-reset':
            await sendPasswordResetEmail(emailData.email, emailData.resetURL);
            break;
          case 'reset-success':
            await sendResetSuccessEmail(emailData.email);
            break;
          default:
            throw new Error(`Tipo de e-mail não suportado: ${emailData.type}`);
        }
        
        results.push({
          email: emailData.email,
          type: emailData.type,
          success: true
        });
      } catch (error) {
        results.push({
          email: emailData.email,
          type: emailData.type,
          success: false,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: 'Processamento de e-mails em lote concluído',
      results: results
    });

  } catch (error) {
    console.error('Erro no servidor:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor ao processar e-mails em lote',
      details: error.message
    });
  }
});

// Middleware para rotas não encontradas (CORRIGIDO)
app.use((req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    availableRoutes: [
      'GET /api/health',
      'POST /api/send-verification-email',
      'POST /api/send-welcome-email',
      'POST /api/send-password-reset-email',
      'POST /api/send-reset-success-email',
      'POST /api/send-batch-emails'
    ]
  });
});

// Inicialização do servidor
app.listen(PORT, () => {
  console.log(`Servidor Mailtrap API rodando na porta ${PORT}`);
  console.log(`Endpoint base: http://localhost:${PORT}/api`);
});