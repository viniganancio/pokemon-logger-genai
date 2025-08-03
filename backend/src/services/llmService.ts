import { InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { bedrockClient } from './awsConfig';

export class LLMService {
  async pokemonizePerson(imageBase64: string): Promise<any> {
    try {
      const prompt = `
You are an expert Pokemon character designer. Analyze this image of a person and create a unique Pokemon character inspired by them.

Please respond with a JSON object containing:
{
  "characteristics": ["list", "of", "observed", "traits"],
  "suggestedPokemon": "A creative Pokemon name",
  "pokemonizedDescription": "A detailed description of how this person would look as a Pokemon character",
  "powerType": "Primary/Secondary type combination",
  "abilities": ["ability1", "ability2", "ability3"],
  "stats": {
    "hp": 85,
    "attack": 75,
    "defense": 70
  },
  "imagePrompt": "A detailed prompt for generating a Pokemon character image in the style of Pokemon official art, focusing on the visual transformation"
}

Focus on:
- Physical characteristics (hair color, build, facial features)
- Perceived personality traits from expression
- Color palette that would suit them
- What type of Pokemon powers would match their vibe
- Creative abilities based on their appearance
- Stats should reflect the person's perceived traits (strong = high ATK, energetic = high HP, sturdy = high DEF)
- Use values between 40-120 for realistic Pokemon stats

For the imagePrompt, create a detailed visual description that would generate a Pokemon character image in the official Pokemon art style, including:
- Pokemon body structure and proportions
- Color scheme and patterns
- Facial features and expressions
- Type-specific visual elements (fire, water, electric effects, etc.)
- Accessories or unique features
- Art style: "Pokemon official artwork style, clean lines, vibrant colors, cute and appealing design"

Be creative and positive! Make this a fun Pokemon transformation.
`;

      const body = {
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/jpeg",
                  data: imageBase64
                }
              }
            ]
          }
        ]
      };

      const command = new InvokeModelCommand({
        modelId: "anthropic.claude-3-sonnet-20240229-v1:0",
        body: JSON.stringify(body),
        contentType: "application/json",
      });

      const response = await bedrockClient.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      const resultText = responseBody.content[0].text.trim();
      
      // Try to parse as JSON, fallback to structured response if not
      try {
        return JSON.parse(resultText);
      } catch (parseError) {
        // Fallback if JSON parsing fails
        return {
          characteristics: ["Unique features detected"],
          suggestedPokemon: "Custom Pokemon",
          pokemonizedDescription: resultText,
          powerType: "Normal/Psychic",
          abilities: ["Adaptability", "Charm", "Quick Thinking"],
          stats: {
            hp: 75,
            attack: 65,
            defense: 70
          },
          imagePrompt: "A cute Pokemon character with unique features, in official Pokemon art style"
        };
      }
    } catch (error) {
      console.error('Error with pokemonization service:', error);
      throw new Error('Failed to pokemonize person');
    }
  }

  async generatePokemonImage(imagePrompt: string): Promise<string> {
    try {
      console.log('🎨 Starting Stable Diffusion image generation...');
      console.log('Prompt:', imagePrompt.substring(0, 100) + '...');

      // Enhanced prompt for Pokemon style
      const enhancedPrompt = `${imagePrompt}, Pokemon official artwork style, anime style, clean lines, vibrant colors, cute and appealing design, high quality, detailed, colorful, fantasy creature`;

      const body = {
        text_prompts: [
          {
            text: enhancedPrompt,
            weight: 1.0
          },
          {
            text: "blurry, low quality, distorted, ugly, deformed, realistic, photographic, dark, scary",
            weight: -1.0
          }
        ],
        cfg_scale: 10,
        steps: 50,
        seed: Math.floor(Math.random() * 1000000),
        width: 512,
        height: 512,
        style_preset: "anime"
      };

      const command = new InvokeModelCommand({
        modelId: "stability.stable-diffusion-xl-v1",
        body: JSON.stringify(body),
        contentType: "application/json",
        accept: "application/json"
      });

      console.log('📡 Calling Stable Diffusion model...');
      const response = await bedrockClient.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      console.log('✅ Image generated successfully!');
      
      // The response contains base64 image data
      return responseBody.artifacts[0].base64;
    } catch (error) {
      console.error('❌ Error generating Pokemon image:', error);
      throw new Error('Failed to generate Pokemon image');
    }
  }

  async identifyPokemon(imageBase64: string): Promise<string> {
    try {
      const prompt = `
You are a Pokemon expert. Analyze this image and identify the Pokemon.

Please respond with ONLY the Pokemon name in lowercase, no additional text.
If you're not sure or can't identify the Pokemon, respond with "unknown".

Examples of good responses:
- pikachu
- charizard
- bulbasaur
- unknown
`;

      const body = {
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 50,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/jpeg",
                  data: imageBase64
                }
              }
            ]
          }
        ]
      };

      const command = new InvokeModelCommand({
        modelId: "anthropic.claude-3-sonnet-20240229-v1:0",
        body: JSON.stringify(body),
        contentType: "application/json",
      });

      const response = await bedrockClient.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      const pokemonName = responseBody.content[0].text.trim().toLowerCase();
      return pokemonName;
    } catch (error) {
      console.error('Error with LLM service:', error);
      throw new Error('Failed to identify Pokemon');
    }
  }
}

export const llmService = new LLMService();