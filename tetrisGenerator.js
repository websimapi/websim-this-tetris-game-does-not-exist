class TetrisGenerator {
  constructor() {
    this.generatedGames = [];
  }
  
  async generateTetrisGame(options) {
    try {
      const { theme, difficulty, uniqueFeature, creatorUsername } = options;
      
      // First LLM call: Generate detailed game concept
      const gameConceptPrompt = `
        Create a unique Tetris game concept based on these parameters:
        - Theme: ${theme}
        - Difficulty: ${difficulty}
        - Unique Feature: ${uniqueFeature}

        The response should include:
        1. A catchy title for the game
        2. A short description of the game
        3. Six taunting or encouraging messages that an AI would say to the player during gameplay that match the theme
        4. Game mechanics details (block fall speed, scoring system)
        5. A detailed theme description for each of the 7 Tetris blocks (I, J, L, O, S, T, Z)

        Respond directly with JSON, following this JSON schema, and no other text:
        {
          "title": string,
          "description": string,
          "aiMessages": [string, string, string, string, string, string],
          "mechanics": {
            "dropSpeed": number (between 0.5 and 3),
            "scoringSystem": {
              "1": number,
              "2": number,
              "3": number,
              "4": number
            }
          },
          "blockThemes": {
            "I": string,
            "J": string,
            "L": string,
            "O": string,
            "S": string,
            "T": string,
            "Z": string
          }
        }
      `;
      
      const gameConceptResponse = await websim.chat.completions.create({
        messages: [
          {
            role: "user",
            content: gameConceptPrompt
          }
        ],
        json: true
      });
      
      const gameConcept = JSON.parse(gameConceptResponse.content);
      
      // Second LLM call: Generate block textures based on the themes
      const texturePromises = [];
      for (const blockType in gameConcept.blockThemes) {
        const description = gameConcept.blockThemes[blockType];
        texturePromises.push(this.generateBlockTexture(blockType, description));
      }
      
      const blockTextures = await Promise.all(texturePromises);
      
      // Create the complete game data
      const gameData = {
        id: Date.now().toString(),
        title: gameConcept.title,
        description: gameConcept.description,
        theme: theme,
        difficulty: difficulty,
        uniqueFeature: uniqueFeature,
        aiMessages: gameConcept.aiMessages,
        mechanics: gameConcept.mechanics,
        blockThemes: gameConcept.blockThemes,
        blockTextures: blockTextures,
        createdBy: creatorUsername,
        createdAt: new Date().toISOString()
      };
      
      this.generatedGames.push(gameData);
      
      return gameData;
    } catch (error) {
      console.error('Error generating Tetris game:', error);
      throw error;
    }
  }
  
  async generateBlockTexture(blockType, description) {
    try {
      const imagePrompt = `
        Create a seamless square texture for a Tetris ${blockType} block with this description: "${description}".
        The texture should be vibrant, clear, and visually distinct. Make it suitable as a repeating pattern.
        Style: Create a visually interesting texture that would look good on a Tetris block.
      `;
      
      const result = await websim.imageGen({
        prompt: imagePrompt,
        aspect_ratio: "1:1"
      });
      
      return result.url;
    } catch (error) {
      console.error(`Error generating texture for block ${blockType}:`, error);
      // Return a placeholder texture url if generation fails
      return null;
    }
  }
}

