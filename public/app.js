import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, getDocs, doc, getDoc } from "firebase/firestore";
import CryptoJS from 'crypto-js'; // npm install crypto-js

const firebaseConfig = {
  apiKey: "AIzaSyDk0xWrvSdrIV9BUM2Y0E6_9tfRG-iRVWo",
  authDomain: "stardustdrive-dfbfe.firebaseapp.com",
  projectId: "stardustdrive-dfbfe",
  storageBucket: "stardustdrive-dfbfe.firebasestorage.app",
  messagingSenderId: "1001042312857",
  appId: "1:1001042312857:web:4d6ce51d8ce7bc62898208",
  measurementId: "G-ZLSNQNHWEN"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const encryptionKey = '0iCeIIYhyz6X/sKHxznRVhxsUIWOPy/21f3S44bP0yA=';

function encrypt(data) {
  return CryptoJS.AES.encrypt(data, encryptionKey).toString();
}

function decrypt(data) {
  const bytes = CryptoJS.AES.decrypt(data, encryptionKey);
  return bytes.toString(CryptoJS.enc.Utf8);
}

// Show finance section on button click
document.getElementById('findCarButton').addEventListener('click', () => {
  const section = document.getElementById('finance-section');
  section.classList.remove('hidden');
  section.style.display = 'block'; // Ensure display is set
});

// Submit form and process data
async function submitForm() {
  const firstName = document.getElementById('firstName').value;
  const lastName = document.getElementById('lastName').value;
  const dob = document.getElementById('dob').value;
  const ssnLast4 = document.getElementById('ssnLast4').value;
  const salary = parseFloat(document.getElementById('salary').value);
  const credit = parseInt(document.getElementById('credit').value);
  const down = parseFloat(document.getElementById('down').value);
  const term = parseInt(document.getElementById('term').value);
  const type = document.getElementById('type').value;
  const vehicleType = document.getElementById('vehicleType').value;
  const fuelType = document.getElementById('fuelType').value;

  const encryptedFirstName = encrypt(firstName);
  const encryptedDob = encrypt(dob);
  const encryptedSsnLast4 = encrypt(ssnLast4);
  const encryptedSalary = encrypt(salary.toString());
  const encryptedCredit = encrypt(credit.toString());

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, `${firstName.toLowerCase()}@stardustdrive.com`, 'tempPass123'); // Demo only
    const userId = userCredential.user.uid;

    await addDoc(collection(db, 'customers'), {
      userId: userId,
      firstName: encryptedFirstName,
      lastName: lastName,
      dob: encryptedDob,
      ssnLast4: encryptedSsnLast4,
      salary: encryptedSalary,
      credit: encryptedCredit,
      preferences: { vehicleType, fuelType },
      timestamp: new Date()
    });

    console.log('Customer data stored successfully.');
    await matchAndSuggest(userId, lastName, salary, credit, down, term, type, vehicleType, fuelType);
  } catch (error) {
    console.error('Error submitting form:', error);
  }
}

async function matchAndSuggest(userId, lastName, salary, credit, down, term, type, vehicleType, fuelType) {
  let apr = credit > 700 ? 3.5 : credit > 600 ? 5.0 : 7.5;
  const querySnapshot = await getDocs(collection(db, 'models'));
  const models = querySnapshot.docs.map(doc => doc.data());

  const affordableModels = models
    .filter(m => {
      if (vehicleType !== 'any' && m.category !== vehicleType) return false;
      if (fuelType !== 'any' && m.fuelType !== fuelType) return false;
      const principal = m.startingPrice - down;
      const monthlyRate = (apr / 100) / 12;
      const payment = type === 'buy'
        ? principal * monthlyRate * Math.pow(1 + monthlyRate, term) / (Math.pow(1 + monthlyRate, term) - 1)
        : (principal / term) + (principal * 0.01);
      return payment <= (salary * 0.1);
    })
    .sort((a, b) => a.startingPrice - b.startingPrice);

  const sampleModel = affordableModels[0] || { name: 'Default Model', startingPrice: 30000 };
  const principal = sampleModel.startingPrice - down;
  const monthlyRate = (apr / 100) / 12;
  let monthlyPayment = type === 'buy'
    ? principal * monthlyRate * Math.pow(1 + monthlyRate, term) / (Math.pow(1 + monthlyRate, term) - 1)
    : (principal / term) + (principal * 0.01);

  document.getElementById('monthlyPayment').textContent = `Monthly Payment for ${sampleModel.name}: $${monthlyPayment.toFixed(2)}`;
  const comparisons = document.getElementById('comparisons');
  comparisons.innerHTML = '';
  [term - 12, term, term + 12].forEach(newTerm => {
    if (newTerm > 0) {
      const newMonthly = principal * monthlyRate * Math.pow(1 + monthlyRate, newTerm) / (Math.pow(1 + monthlyRate, newTerm) - 1);
      const li = document.createElement('li');
      li.textContent = `${newTerm} months: $${newMonthly.toFixed(2)}`;
      comparisons.appendChild(li);
    }
  });

  const suggestions = document.getElementById('suggestions');
  suggestions.innerHTML = '';
  affordableModels.forEach(m => {
    const li = document.createElement('li');
    li.textContent = `${m.name} - $${m.startingPrice} (Fuel: ${m.fuelType}, Economy: ${m.fuelEconomy}) - ${type === 'lease' ? 'Lease Option' : 'Financing Option'}`;
    suggestions.appendChild(li);
  });

  const tips = document.getElementById('tips');
  tips.innerHTML = '';
  if (credit < 600) tips.innerHTML += '<li>Improve your credit score to lower APR.</li>';
  if (down < 2000) tips.innerHTML += '<li>Consider a higher down payment to reduce monthly costs.</li>';
  tips.innerHTML += '<li>Explore hybrid models for fuel savings.</li>';

  document.getElementById('results').style.display = 'block';
}

window.submitForm = submitForm;

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('User logged in:', user.uid);
  } else {
    console.log('No user signed in');
  }
});