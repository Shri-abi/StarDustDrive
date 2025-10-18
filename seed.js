import { db, collection, addDoc } from './firebase.js';

const models = [
  { category: 'Sedans', name: 'Camry', startingPrice: 28700, fuelEconomy: '53/50', fuelType: 'Hybrid' },
  { category: 'Sedans', name: 'Corolla', startingPrice: 22325, fuelEconomy: '32/41', fuelType: 'Gas' },
  { category: 'SUVs', name: 'RAV4', startingPrice: 29800, fuelEconomy: '27/35', fuelType: 'Gas' },
  { category: 'SUVs', name: 'RAV4 Hybrid', startingPrice: 32850, fuelEconomy: '41/38', fuelType: 'Hybrid' },
  { category: 'Trucks', name: 'Tacoma', startingPrice: 31590, fuelEconomy: '21/26', fuelType: 'Gas' },
  { category: 'Sedans', name: 'Prius', startingPrice: 28350, fuelEconomy: '57/56', fuelType: 'Hybrid' }
];

async function seedModels() {
  try {
    console.log('Starting to seed models...');
    for (const model of models) {
      await addDoc(collection(db, 'models'), model);
      console.log(`✅ Added ${model.name}`);
    }
    console.log('🎉 Seeding complete! Check Firebase Console.');
  } catch (error) {
    console.error('❌ Error seeding models:', error);
  }
}

seedModels();