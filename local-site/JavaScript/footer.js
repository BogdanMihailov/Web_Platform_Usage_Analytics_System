const footerContactFormP = document.querySelector('.footer__contact__form__p');
const tabletFooterContactFormP = document.querySelector('.tablet__footer__contact__form__p');

const contactForm = document.querySelector('.contact__form');

if (footerContactFormP) {

     footerContactFormP.addEventListener("click", function (e) {
          if (contactForm.classList.contains('_active')) {}
          else {contactForm.classList.toggle('_active')}
          if (body.classList.contains('_active')) {}
          else {body.classList.toggle('_active')}
     });
}


if (tabletFooterContactFormP) {

     tabletFooterContactFormP.addEventListener("click", function (e) {
          if (contactForm.classList.contains('_active')) {}
          else {contactForm.classList.toggle('_active')}
          if (body.classList.contains('_active')) {}
          else {body.classList.toggle('_active')}
     });
}



const contactFormCloseImg = document.querySelector('.contact__form__close__img');

if (contactFormCloseImg) {

     contactFormCloseImg.addEventListener("click", function (e) {
          if (contactForm.classList.contains('_active')) {
               contactForm.classList.remove('_active')
          }
          if (body.classList.contains('_active')) {
               body.classList.remove('_active')
          }

     });
}

