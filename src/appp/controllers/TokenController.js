import * as Yup from 'yup';
import fetch from 'node-fetch'; // Importando node-fetch
import Tokens from '../models/Token.js'; // Ajuste o caminho para a sua model Token

class TokenController {
  // Rota POST para armazenar um novo token
  async store(request, response) {
    const schema = Yup.object().shape({
      link_token: Yup.string().required()
    });

    try {
      await schema.validateSync(request.body, { abortEarly: false });
    } catch (err) {
      return response.status(400).json({ error: err.errors });
    }

    const { link_token } = request.body;

    await Tokens.create({
      link_token,
    });

    return response.status(201).json({ link_token });
  }

  // Rota GET para verificar e retornar o token e dados adicionais
  async index(request, response) {
    const currentDate = new Date();

    try {
      const existingToken = await Tokens.findOne();

      if (!existingToken) {
        return response.status(404).json({ error: 'Token não encontrado.' });
      }

      const daysSinceLastUpdate = calculateDaysDifference(new Date(existingToken.updatedAt), currentDate);

      if (daysSinceLastUpdate >= 50) {
        try {
          // Adicionando parâmetros de consulta diretamente à URL
          const tokenUrl = new URL('https://graph.instagram.com/refresh_access_token');
          tokenUrl.searchParams.append('grant_type', 'ig_refresh_token');
          tokenUrl.searchParams.append('access_token', existingToken.link_token);

          const tokenResponse = await fetch(tokenUrl.toString(), {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          });

          const tokenData = await tokenResponse.json();
          const newToken = tokenData.access_token;
          existingToken.link_token = newToken;
          existingToken.updatedAt = currentDate;
          await existingToken.save();
          
          // Atualiza o token e obtém os dados adicionais
          try {
            const apiUrl = new URL('https://graph.instagram.com/me/media');
            apiUrl.searchParams.append('fields', 'id, caption, media_type, media_url, thumbnail_url, permalink, timestamp, username, like_count, comments_count');
            apiUrl.searchParams.append('access_token', newToken);

            const apiResponse = await fetch(apiUrl.toString(), {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              }
            });

            const apiData = await apiResponse.json();
      
            return response.status(200).json({
              data: apiData.data
            });
          } catch (error) {
            console.error('Erro ao buscar dados da API do Instagram:', error);
            return response.status(500).json({ error: 'Erro ao buscar dados da API do Instagram.' });
          }
        } catch (error) {
          return response.status(500).json({ error: 'Erro ao renovar o token.' });
        }
      } else {
        // Chamando a API do Facebook para buscar o feed do Instagram 
        try {
          const apiUrl = new URL('https://graph.instagram.com/me/media');
          apiUrl.searchParams.append('fields', 'id, caption, media_type, media_url, thumbnail_url, permalink, timestamp, username');
          apiUrl.searchParams.append('access_token', existingToken.link_token);

          const apiResponse = await fetch(apiUrl.toString(), {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          });

          const apiData = await apiResponse.json();
    
          return response.status(200).json({
            id_Token: existingToken.id,
            data: apiData.data
          });
        } catch (error) {
          console.error('Erro ao buscar dados da API do Instagram:', error);
          return response.status(500).json({ error: 'Erro ao buscar dados da API do Instagram.' });
        }
      }
    } catch (error) {
      console.error('Erro ao acessar o token:', error);
      return response.status(500).json({ error: 'Erro ao acessar o token.' });
    }
  }

  async update(request, response) {
    const schema = Yup.object().shape({
      link_token: Yup.string().required(),
    });
  
    try {
      await schema.validateSync(request.body, { abortEarly: false });
    } catch (err) {
      return response.status(400).json({ error: err.errors });
    }
  
    const { id } = request.params;
  
    const tokensExists = await Tokens.findOne({
      where: { id },
    });
  
    if (!tokensExists) {
      return response.status(400).json({ error: 'Consulta Não Encontrada' });
    }
  
    const { link_token } = request.body;
  
    await Tokens.update(
      {
        link_token,
      },
      { where: { id } }
    );
  
    return response.json({ message: 'Status was updated successfully' });
  }
  
}

// Função para calcular a diferença em dias entre duas datas
const calculateDaysDifference = (startDate, endDate) => {
  const oneDay = 24 * 60 * 60 * 1000; // Milissegundos em um dia
  return Math.round((endDate.getTime() - startDate.getTime()) / oneDay);
};

export default new TokenController();
