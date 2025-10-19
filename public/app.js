// Ensure Firebase is loaded
if (typeof firebase === 'undefined') {
    console.error('Firebase is not loaded. Check CDN scripts in index.html.');
  } else {
    const firebaseConfig = {
      apiKey: "AIzaSyDk0xWrvSdrIV9BUM2Y0E6_9tfRG-iRVWo",
      authDomain: "stardustdrive-dfbfe.firebaseapp.com",
      projectId: "stardustdrive-dfbfe",
      storageBucket: "stardustdrive-dfbfe.firebasestorage.app",
      messagingSenderId: "1001042312857",
      appId: "1:1001042312857:web:4d6ce51d8ce7bc62898208",
      measurementId: "G-ZLSNQNHWEN"
    };
  
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();
  
    const encryptionKey = '0iCeIIYhyz6X/sKHxznRVhxsUIWOPy/21f3S44bP0yA=';
  
    function encrypt(data) {
      return CryptoJS.AES.encrypt(data, encryptionKey).toString();
    }
  
    function decrypt(data) {
      const bytes = CryptoJS.AES.decrypt(data, encryptionKey);
      return bytes.toString(CryptoJS.enc.Utf8);
    }
  
    // Global function definitions
    window.showLoginModal = () => {
      const loginModal = document.getElementById('login-modal');
      if (loginModal) {
        loginModal.classList.remove('hidden');
        if ('showModal' in loginModal) {
          loginModal.showModal();
        } else {
          loginModal.style.display = 'block'; // Fallback for older browsers
        }
        console.log('Login modal shown');
      } else {
        console.error('Login modal not found');
      }
    };
  
    window.showRegisterModal = () => {
      const registerModal = document.getElementById('register-modal');
      if (registerModal) {
        registerModal.classList.remove('hidden');
        if ('showModal' in registerModal) {
          registerModal.showModal();
        } else {
          registerModal.style.display = 'block'; // Fallback
        }
        console.log('Register modal shown');
      } else {
        console.error('Register modal not found');
      }
    };
  
    window.togglePlansDropdown = () => {
      const plansDropdown = document.querySelector('.dropdown');
      const dropdownContent = plansDropdown ? plansDropdown.querySelector('.dropdown-content') : null;
      if (dropdownContent) {
        if (dropdownContent.style.display === 'block') {
          dropdownContent.style.display = 'none';
        } else {
          dropdownContent.style.display = 'block';
        }
        plansDropdown.classList.toggle('active');
      } else {
        console.error('Dropdown content not found');
      }
    };
  
    window.submitForm = async function () {
      const firstName = document.getElementById('firstName').value;
      const lastName = document.getElementById('lastName').value;
      const dob = document.getElementById('dob').value;
      const ssnLast4 = document.getElementById('ssnLast4').value;
      const income = parseFloat(document.getElementById('income').value);
      const credit = parseInt(document.getElementById('credit').value);
      const preference = document.getElementById('preference').value;
  
      if (!firstName || !lastName || !dob || !ssnLast4 || isNaN(income) || isNaN(credit) || !preference) {
        console.error('All fields are required');
        return;
      }
  
      const encryptedFirstName = encrypt(firstName);
      const encryptedDob = encrypt(dob);
      const encryptedSsnLast4 = encrypt(ssnLast4);
      const encryptedIncome = encrypt(income.toString());
      const encryptedCredit = encrypt(credit.toString());
  
      try {
        const userCredential = await auth.createUserWithEmailAndPassword(`${firstName.toLowerCase()}@stardustdrive.com`, 'tempPass123'); // Demo only
        const userId = userCredential.user.uid;
  
        await db.collection('customers').add({
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
  
        console.log('Customer data stored successfully.');
        analyzeAndSuggest(userId, lastName, income, credit, preference);
      } catch (error) {
        console.error('Error submitting form:', error);
      }
    };
  
    async function analyzeAndSuggest(userId, lastName, income, credit, preference) {
      const apr = credit > 700 ? 3.5 : credit > 600 ? 5.0 : 7.5;
      const querySnapshot = await db.collection('models').get();
      const models = querySnapshot.docs.map(doc => doc.data());
  
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
    }
  
    window.closeForm = () => {
      const financeSection = document.getElementById('finance-section');
      if (financeSection) {
        financeSection.close();
        financeSection.classList.add('hidden');
      }
    };
  
    window.loginUser = async () => {
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      if (password.length < 8) {
        alert('Password must be at least 8 characters long.');
        return;
      }
      try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        console.log('User logged in:', userCredential.user.uid);
        closeLoginModal();
      } catch (error) {
        console.error('Login error:', error.message);
      }
    };
  
    window.loginWithGoogle = async () => {
      const provider = new firebase.auth.GoogleAuthProvider();
      try {
        const result = await auth.signInWithPopup(provider);
        console.log('Google login successful:', result.user.uid);
        closeLoginModal();
      } catch (error) {
        console.error('Google login error:', error.message);
      }
    };
  
    window.loginWithPhone = async () => {
      const phoneNumber = prompt('Enter your phone number (e.g., +1XXXXXXXXXX)');
      if (phoneNumber) {
        const appVerifier = window.recaptchaVerifier; // Requires reCAPTCHA setup
        try {
          const confirmationResult = await auth.signInWithPhoneNumber(phoneNumber, appVerifier);
          const code = prompt('Enter the verification code');
          const result = await confirmationResult.confirm(code);
          console.log('Phone login successful:', result.user.uid);
          closeLoginModal();
        } catch (error) {
          console.error('Phone login error:', error.message);
        }
      }
    };
  
    window.loginPasswordless = async () => {
      const email = prompt('Enter your email for passwordless login');
      if (email) {
        const actionCodeSettings = {
          url: 'http://localhost:3000',
          handleCodeInApp: true,
        };
        try {
          await auth.sendSignInLinkToEmail(email, actionCodeSettings);
          window.localStorage.setItem('emailForSignIn', email);
          alert('Check your email for the sign-in link!');
        } catch (error) {
          console.error('Passwordless login error:', error.message);
        }
      }
      if (auth.isSignInWithEmailLink(window.location.href)) {
        const email = window.localStorage.getItem('emailForSignIn');
        if (!email) email = prompt('Please provide your email for confirmation');
        try {
          const result = await auth.signInWithEmailLink(email, window.location.href);
          console.log('Passwordless login successful:', result.user.uid);
          window.localStorage.removeItem('emailForSignIn');
          closeLoginModal();
        } catch (error) {
          console.error('Email link sign-in error:', error.message);
        }
      }
    };
  
    window.registerUser = async () => {
      const email = document.getElementById('registerEmail').value;
      const password = document.getElementById('registerPassword').value;
      if (password.length < 8) {
        alert('Password must be at least 8 characters long.');
        return;
      }
      const encryptedPassword = encrypt(password);
      try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const userId = userCredential.user.uid;
        await db.collection('users').add({
          userId: userId,
          email: email,
          password: encryptedPassword,
          timestamp: new Date()
        });
        console.log('User registered successfully:', userId);
        closeRegisterModal();
      } catch (error) {
        console.error('Registration error:', error.message);
      }
    };
  
    window.closeLoginModal = () => {
      const loginModal = document.getElementById('login-modal');
      if (loginModal) {
        loginModal.close();
        loginModal.classList.add('hidden');
      }
    };
  
    window.closeRegisterModal = () => {
      const registerModal = document.getElementById('register-modal');
      if (registerModal) {
        registerModal.close();
        registerModal.classList.add('hidden');
      }
    };
  
    // Event listener for dynamic loading
    document.addEventListener('DOMContentLoaded', () => {
      const findCarButton = document.getElementById('findCarButton');
      const financeSection = document.getElementById('finance-section');
  
      if (findCarButton && financeSection) {
        findCarButton.addEventListener('click', () => {
          financeSection.classList.remove('hidden');
          if ('showModal' in financeSection) {
            financeSection.showModal();
          } else {
            financeSection.style.display = 'block';
          }
          console.log('Find Your Dream Car clicked - form shown');
        });
      } else {
        console.error('FindCarButton or financeSection not found');
      }
  
      document.addEventListener('click', (e) => {
        const dialogs = [document.getElementById('finance-section'), document.getElementById('login-modal'), document.getElementById('register-modal')];
        const plansDropdown = document.querySelector('.dropdown');
        const dropdownContent = plansDropdown ? plansDropdown.querySelector('.dropdown-content') : null;
  
        dialogs.forEach(dialog => {
          if (dialog && !dialog.contains(e.target) && e.target.tagName !== 'BUTTON') {
            dialog.close();
            dialog.classList.add('hidden');
          }
        });
  
        if (dropdownContent && !plansDropdown.contains(e.target) && e.target.tagName !== 'A') {
          dropdownContent.style.display = 'none';
          plansDropdown.classList.remove('active');
        }
      });
    });
  
    auth.onAuthStateChanged((user) => {
      if (user) {
        console.log('User logged in:', user.uid);
      } else {
        console.log('No user signed in');
      }
    });
  }