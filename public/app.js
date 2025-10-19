// Import Firebase services
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import { getFirestore, collection, addDoc, getDocs } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDk0xWrvSdrIV9BUM2Y0E6_9tfRG-iRVWo",
  authDomain: "stardustdrive-dfbfe.firebaseapp.com",
  projectId: "stardustdrive-dfbfe",
  storageBucket: "stardustdrive-dfbfe.firebasestorage.app",
  messagingSenderId: "1001042312857",
  appId: "1:1001042312857:web:4d6ce51d8ce7bc62898208",
  measurementId: "G-ZLSNQNHWEN"
};

// Initialize Firebase
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

// Event listener for dynamic loading
document.addEventListener('DOMContentLoaded', () => {
  const findCarButton = document.getElementById('findCarButton');
  const financeSection = document.getElementById('finance-section');
  const submitButton = document.getElementById('financeForm')?.querySelector('button[onclick="submitForm()"]');

  if (findCarButton && financeSection) {
    findCarButton.addEventListener('click', () => {
      financeSection.classList.remove('hidden');
      if ('showModal' in financeSection) {
        financeSection.showModal();
        console.log('Finance modal shown with showModal');
      } else {
        financeSection.style.display = 'block';
        financeSection.style.zIndex = '1001';
        console.log('Finance modal shown with fallback display');
      }
    });
  } else {
    console.error('FindCarButton or financeSection not found');
  }

  if (submitButton) {
    submitButton.addEventListener('click', (e) => {
      e.preventDefault(); // Prevent default form submission
      console.log('Submit button clicked');
      submitForm();
    });
  } else {
    console.error('Submit button not found');
  }

  document.addEventListener('click', (e) => {
    const dialogs = [document.getElementById('finance-section'), document.getElementById('login-modal'), document.getElementById('register-modal')];
    const plansDropdown = document.querySelector('.nav-item.dropdown');
    const dropdownContent = plansDropdown ? plansDropdown.querySelector('.dropdown-content') : null;

    dialogs.forEach(dialog => {
      if (dialog && !dialog.contains(e.target) && e.target.tagName !== 'BUTTON') {
        if ('close' in dialog) {
          dialog.close();
        }
        dialog.classList.add('hidden');
        console.log(`Dialog ${dialog.id} closed`);
      }
    });

    if (dropdownContent && !plansDropdown.contains(e.target) && e.target.tagName !== 'A') {
      dropdownContent.style.display = 'none';
      plansDropdown.classList.remove('active');
      console.log('Plans dropdown closed');
    }
  });
});

// Define additional functions
window.submitForm = async function () {
  console.log('submitForm function called');
  const firstName = document.getElementById('firstName')?.value;
  const lastName = document.getElementById('lastName')?.value;
  const dob = document.getElementById('dob')?.value;
  const ssnLast4 = document.getElementById('ssnLast4')?.value;
  const income = parseFloat(document.getElementById('income')?.value) || 0;
  const credit = parseInt(document.getElementById('credit')?.value) || 0;
  const preference = document.getElementById('preference')?.value;

  if (!firstName || !lastName || !dob || !ssnLast4 || isNaN(income) || isNaN(credit) || !preference) {
    console.error('All fields are required:', { firstName, lastName, dob, ssnLast4, income, credit, preference });
    alert('Please fill in all fields.');
    return;
  }

  const encryptedFirstName = encrypt(firstName);
  const encryptedDob = encrypt(dob);
  const encryptedSsnLast4 = encrypt(ssnLast4);
  const encryptedIncome = encrypt(income.toString());
  const encryptedCredit = encrypt(credit.toString());

  try {
    console.log('Attempting to create user with email:', `${firstName.toLowerCase()}@stardustdrive.com`);
    const userCredential = await createUserWithEmailAndPassword(auth, `${firstName.toLowerCase()}@stardustdrive.com`, 'tempPass123');
    const userId = userCredential.user.uid;
    console.log('User created successfully, UID:', userId);

    const customersCollection = collection(db, 'customers');
    await addDoc(customersCollection, {
      userId: userId,
      firstName: encryptedFirstName,
      lastName: lastName,
      dob: encryptedDob,
      ssnLast4: encryptedSsnLast4,
      income: encryptedIncome,
      credit: encryptedCredit,
      preference: preference,
      timestamp: new Date()
    });
    console.log('Customer data stored successfully');

    analyzeAndSuggest(userId, lastName, income, credit, preference);
  } catch (error) {
    console.error('Error submitting form:', error);
    alert(`Submission failed: ${error.message}`);
  }
};

async function analyzeAndSuggest(userId, lastName, income, credit, preference) {
  console.log('Analyzing and suggesting for user:', userId);
  const apr = credit > 700 ? 3.5 : credit > 600 ? 5.0 : 7.5;
  try {
    const modelsCollection = collection(db, 'models');
    const querySnapshot = await getDocs(modelsCollection);
    const models = querySnapshot.docs.map(doc => doc.data());

    if (models.length === 0) {
      console.warn('No models found in Firestore, using mock data');
      models.push({ name: 'Camry', startingPrice: 28700, fuelType: 'Hybrid', fuelEconomy: '53/50' });
      models.push({ name: 'RAV4', startingPrice: 29800, fuelType: 'Gas', fuelEconomy: '27/35' });
    }

    const affordableModels = models
      .filter(m => {
        const principal = m.startingPrice;
        const monthlyRate = (apr / 100) / 12;
        const term = 36;
        const payment = principal * monthlyRate * Math.pow(1 + monthlyRate, term) / (Math.pow(1 + monthlyRate, term) - 1);
        return payment <= (income * 0.1);
      })
      .sort((a, b) => a.startingPrice - b.startingPrice);

    const sampleModel = affordableModels[0] || { name: 'Default Model', startingPrice: 30000 };
    const principal = sampleModel.startingPrice;
    const monthlyRate = (apr / 100) / 12;
    const term = 36;
    const payment = principal * monthlyRate * Math.pow(1 + monthlyRate, term) / (Math.pow(1 + monthlyRate, term) - 1);

    document.getElementById('monthlyPayment').textContent = `APR: ${apr}%, Monthly Payment for ${sampleModel.name}: $${payment.toFixed(2)}, Fits Budget: ${payment <= (income * 0.1) ? 'Yes' : 'No'}`;
    const comparisons = document.getElementById('comparisons');
    comparisons.innerHTML = '';
    [24, 36, 48].forEach(newTerm => {
      const newMonthly = principal * monthlyRate * Math.pow(1 + monthlyRate, newTerm) / (Math.pow(1 + monthlyRate, newTerm) - 1);
      const li = document.createElement('li');
      li.textContent = `${newTerm} months: $${newMonthly.toFixed(2)}`;
      comparisons.appendChild(li);
    });

    const suggestions = document.getElementById('suggestions');
    suggestions.innerHTML = '';
    affordableModels.forEach(m => {
      const li = document.createElement('li');
      li.textContent = `${m.name} - $${m.startingPrice} (Fuel: ${m.fuelType}, Economy: ${m.fuelEconomy}) - Matches ${preference}`;
      suggestions.appendChild(li);
    });

    const tips = document.getElementById('tips');
    tips.innerHTML = '';
    if (credit < 600) tips.innerHTML += '<li>Improve your credit score to lower APR.</li>';
    if (income < 3000) tips.innerHTML += '<li>Consider increasing income or down payment.</li>';
    tips.innerHTML += '<li>Explore fuel-efficient models to save long-term.</li>';

    document.getElementById('results').style.display = 'block';
    console.log('Analysis and suggestions displayed');
  } catch (error) {
    console.error('Error in analyzeAndSuggest:', error);
    alert('Failed to generate analysis: ' + error.message);
  }
};

window.closeForm = function () {
  const financeSection = document.getElementById('finance-section');
  if (financeSection) {
    if ('close' in financeSection) {
      financeSection.close();
    }
    financeSection.classList.add('hidden');
    console.log('Finance form closed');
  } else {
    console.error('Finance section not found');
  }
};

window.loginUser = async function () {
  const email = document.getElementById('loginEmail')?.value;
  const password = document.getElementById('loginPassword')?.value;
  if (password && password.length < 8) {
    alert('Password must be at least 8 characters long.');
    return;
  }
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('User logged in:', userCredential.user.uid);
    closeLoginModal();
  } catch (error) {
    console.error('Login error:', error.message);
    alert('Login failed: ' + error.message);
  }
};

window.loginWithGoogle = async function () {
  try {
    const provider = new auth.GoogleAuthProvider();
    const result = await auth.signInWithPopup(provider);
    console.log('Google login successful:', result.user.uid);
    closeLoginModal();
  } catch (error) {
    console.error('Google login error:', error.message);
    alert('Google login failed: ' + error.message);
  }
};

window.loginWithPhone = async function () {
  try {
    const phoneNumber = prompt('Enter your phone number (e.g., +1XXXXXXXXXX)');
    if (phoneNumber) {
      const appVerifier = new auth.RecaptchaVerifier('recaptcha-container', { size: 'invisible' });
      const confirmationResult = await auth.signInWithPhoneNumber(phoneNumber, appVerifier);
      const code = prompt('Enter the verification code');
      const result = await confirmationResult.confirm(code);
      console.log('Phone login successful:', result.user.uid);
      closeLoginModal();
    }
  } catch (error) {
    console.error('Phone login error:', error.message);
    alert('Phone login failed: ' + error.message);
  }
};

window.loginPasswordless = async function () {
  try {
    const email = prompt('Enter your email for passwordless login');
    if (email) {
      const actionCodeSettings = {
        url: 'http://localhost:3000',
        handleCodeInApp: true,
      };
      await auth.sendSignInLinkToEmail(email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', email);
      alert('Check your email for the sign-in link!');
    }
  } catch (error) {
    console.error('Passwordless login error:', error.message);
    alert('Passwordless login failed: ' + error.message);
  }
};

window.registerUser = async function () {
  const email = document.getElementById('registerEmail')?.value;
  const password = document.getElementById('registerPassword')?.value;
  if (password && password.length < 8) {
    alert('Password must be at least 8 characters long.');
    return;
  }
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;
    const encryptedPassword = encrypt(password);
    const usersCollection = collection(db, 'users');
    await addDoc(usersCollection, {
      userId: userId,
      email: email,
      password: encryptedPassword,
      timestamp: new Date()
    });
    console.log('User registered successfully:', userId);
    closeRegisterModal();
  } catch (error) {
    console.error('Registration error:', error.message);
    alert('Registration failed: ' + error.message);
  }
};

window.togglePlansDropdown = function () {
  const plansDropdown = document.querySelector('.nav-item.dropdown');
  const dropdownContent = plansDropdown ? plansDropdown.querySelector('.dropdown-content') : null;
  if (dropdownContent) {
    const currentDisplay = dropdownContent.style.display || getComputedStyle(dropdownContent).display;
    dropdownContent.style.display = currentDisplay === 'block' ? 'none' : 'block';
    plansDropdown.classList.toggle('active');
    console.log('Plans dropdown toggled to:', dropdownContent.style.display, 'from computed:', currentDisplay);
  } else {
    console.error('Dropdown content not found. PlansDropdown:', plansDropdown);
  }
};

auth.onAuthStateChanged((user) => {
  if (user) {
    console.log('User logged in:', user.uid);
  } else {
    console.log('No user signed in');
  }
});