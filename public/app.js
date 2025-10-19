document.addEventListener('DOMContentLoaded', () => {
    const findCarButton = document.getElementById('findCarButton');
    const financeSection = document.getElementById('finance-section');
    const plansDropdown = document.querySelector('.dropdown');
    const loginModal = document.getElementById('login-modal');
    const registerModal = document.getElementById('register-modal');
  
    findCarButton.addEventListener('click', () => {
      financeSection.classList.remove('hidden');
      financeSection.showModal(); // Use showModal for dialog
      console.log('Find Your Dream Car clicked - form shown');
    });
  
    window.showLoginModal = () => {
      loginModal.classList.remove('hidden');
      loginModal.showModal(); // Use showModal for dialog
      console.log('Login modal shown');
    };
  
    window.showRegisterModal = () => {
      registerModal.classList.remove('hidden');
      registerModal.showModal(); // Use showModal for dialog
      console.log('Register modal shown');
    };
  
    window.closeLoginModal = () => {
      loginModal.close();
    };
  
    window.closeRegisterModal = () => {
      registerModal.close();
    };
  
    plansDropdown.addEventListener('mouseover', () => {
      const dropdownContent = plansDropdown.querySelector('.dropdown-content');
      dropdownContent.style.display = 'block';
    });
  
    plansDropdown.addEventListener('mouseout', () => {
      const dropdownContent = plansDropdown.querySelector('.dropdown-content');
      dropdownContent.style.display = 'none';
    });
  
    document.querySelectorAll('.dropdown-content a').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        window.open(link.href, '_blank');
      });
    });
  });