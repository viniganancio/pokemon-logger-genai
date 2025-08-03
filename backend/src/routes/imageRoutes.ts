import express from 'express';
import multer from 'multer';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { imageService } from '../services/imageService';
import { llmService } from '../services/llmService';
import { authenticateToken } from '../middleware';
import { AuthRequest } from '../types';
import { s3Client, AWS_CONFIG } from '../services/awsConfig';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Upload image and identify Pokemon
router.post('/identify', authenticateToken, upload.single('image'), async (req: AuthRequest, res) => {
  console.log('=== IMAGE UPLOAD ENDPOINT CALLED ===');
  console.log('Request headers:', req.headers);
  console.log('Request file:', req.file ? 'Present' : 'Missing');
  console.log('User:', req.user);
  
  try {
    if (!req.file) {
      console.log('ERROR: No image file provided');
      return res.status(400).json({ error: 'No image file provided' });
    }

    console.log('File details:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // Upload image to S3
    const fileName = await imageService.uploadImage(req.file.buffer, req.file.originalname);
    
    // Convert buffer to base64 for LLM
    const imageBase64 = req.file.buffer.toString('base64');
    
    // Identify Pokemon using LLM
    const pokemonName = await llmService.identifyPokemon(imageBase64);
    
    if (pokemonName === 'unknown') {
      return res.json({
        success: false,
        message: 'Could not identify Pokemon from image',
        imageUrl: await imageService.getSignedUrl(fileName),
      });
    }

    // Fetch Pokemon data from PokeAPI
    try {
      const apiResponse = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonName.toLowerCase()}`);
      const pokemonData = apiResponse.data;
      
      const response = {
        success: true,
        pokemon: {
          id: pokemonData.id,
          name: pokemonData.name,
          image: pokemonData.sprites.other['official-artwork'].front_default,
          types: pokemonData.types.map((type: any) => type.type.name),
          stats: pokemonData.stats,
          height: pokemonData.height,
          weight: pokemonData.weight,
        },
        uploadedImageUrl: await imageService.getSignedUrl(fileName),
        identifiedAs: pokemonName,
      };
      
      console.log('=== SUCCESS: Sending response ===');
      console.log('Response size:', JSON.stringify(response).length, 'characters');
      
      return res.json(response);
    } catch (pokemonError) {
      return res.json({
        success: false,
        message: `Pokemon "${pokemonName}" identified but not found in PokeAPI`,
        imageUrl: await imageService.getSignedUrl(fileName),
        identifiedAs: pokemonName,
      });
    }
      } catch (error) {
      console.error('=== ERROR in image identification ===');
      console.error('Error details:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
      
      res.status(500).json({ 
        error: 'Failed to process image',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
});

// Pokemonize person image
router.post('/pokemonize', authenticateToken, upload.single('image'), async (req: AuthRequest, res) => {
  console.log('=== POKEMONIZE ENDPOINT CALLED ===');
  console.log('Request file:', req.file ? 'Present' : 'Missing');
  
  try {
    if (!req.file) {
      console.log('ERROR: No image file provided');
      return res.status(400).json({ error: 'No image file provided' });
    }

    console.log('File details:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // Upload image to S3
    const fileName = await imageService.uploadImage(req.file.buffer, req.file.originalname);
    
    // Convert buffer to base64 for LLM
    const imageBase64 = req.file.buffer.toString('base64');
    
    // Analyze person and create Pokemon character
    const pokemonizationResult = await llmService.pokemonizePerson(imageBase64);
    
    // Generate Pokemon image using Stable Diffusion
    let generatedImageUrl = null;
    if (pokemonizationResult.imagePrompt) {
      try {
        console.log('🎨 Generating Pokemon image...');
        const generatedImageBase64 = await llmService.generatePokemonImage(pokemonizationResult.imagePrompt);
        
        // Convert base64 to buffer and upload to S3
        const imageBuffer = Buffer.from(generatedImageBase64, 'base64');
        const generatedFileName = `pokemon-generated/${uuidv4()}.png`;
        
        console.log('📤 Uploading generated image to S3...');
        const putCommand = new PutObjectCommand({
          Bucket: AWS_CONFIG.s3Bucket,
          Key: generatedFileName,
          Body: imageBuffer,
          ContentType: 'image/png',
        });
        
        await s3Client.send(putCommand);
        generatedImageUrl = await imageService.getSignedUrl(generatedFileName);
        console.log('✅ Generated image uploaded successfully!');
      } catch (imageError) {
        console.error('❌ Failed to generate Pokemon image:', imageError);
        // Continue without generated image - don't fail the whole request
      }
    }
    
    const response = {
      success: true,
      analysis: pokemonizationResult,
      uploadedImageUrl: await imageService.getSignedUrl(fileName),
      generatedPokemonImageUrl: generatedImageUrl,
    };
    
    console.log('=== SUCCESS: Sending pokemonization response ===');
    console.log('Response size:', JSON.stringify(response).length, 'characters');
    
    return res.json(response);
    
  } catch (error) {
    console.error('=== ERROR in pokemonization ===');
    console.error('Error details:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    res.status(500).json({ 
      error: 'Failed to process image',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Save custom Pokemon to collection
router.post('/save-custom-pokemon', authenticateToken, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { pokemonId, pokemonName, pokemonImage, pokemonTypes, category, notes = '' } = req.body;

  if (!pokemonId || !pokemonName || !category) {
    return res.status(400).json({ error: 'Pokemon ID, name, and category are required' });
  }

  if (!['caught', 'want-to-catch', 'favorites'].includes(category)) {
    return res.status(400).json({ error: 'Invalid category' });
  }

  try {
    const userPokemonId = Date.now().toString();
    const dateAdded = new Date().toISOString();

    const { db } = require('../database');

    db.run(
      `INSERT INTO user_pokemon 
       (id, userId, pokemonId, pokemonName, pokemonImage, pokemonTypes, category, notes, dateAdded) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userPokemonId,
        userId,
        pokemonId,
        pokemonName,
        pokemonImage || '',
        JSON.stringify(pokemonTypes || []),
        category,
        notes,
        dateAdded
      ],
      function(err: any) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        res.status(201).json({
          id: userPokemonId,
          userId,
          pokemonId,
          pokemonName,
          pokemonImage: pokemonImage || '',
          pokemonTypes: pokemonTypes || [],
          category,
          notes,
          dateAdded
        });
      }
    );
  } catch (error) {
    console.error('Error saving custom Pokemon:', error);
    res.status(500).json({ error: 'Failed to save custom Pokemon' });
  }
});

// Get signed URL for existing image
router.get('/url/:fileName', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { fileName } = req.params;
    const signedUrl = await imageService.getSignedUrl(fileName);
    res.json({ url: signedUrl });
  } catch (error) {
    console.error('Error getting signed URL:', error);
    res.status(500).json({ error: 'Failed to get image URL' });
  }
});

export default router;