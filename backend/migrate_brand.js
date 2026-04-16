const mongoose = require('mongoose');
const MONGO_URI = 'mongodb://localhost:27017/projectdb';

async function migrate() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const models = ['Project', 'Credential', 'Document', 'Video', 'ActivityLog', 'User'];
    
    for (const modelName of models) {
      let Model;
      try {
        Model = mongoose.model(modelName);
      } catch (e) {
        // Create a basic schema if model not yet defined
        Model = mongoose.model(modelName, new mongoose.Schema({ brand: String }, { strict: false }));
      }
      
      const result = await Model.updateMany(
        { brand: { $exists: false } }, 
        { $set: { brand: 'antigraviity' } }
      );
      console.log(`Updated ${modelName}: matched ${result.matchedCount}, modified ${result.modifiedCount}`);
    }

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
