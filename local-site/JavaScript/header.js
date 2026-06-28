const tabletHeaderBurgerHr1 = document.querySelector('.tablet__header__burger__hr__1');
const tabletHeaderBurgerHr2 = document.querySelector('.tablet__header__burger__hr__2');
const tabletHeaderLogoBlack = document.querySelector('.tablet__header__logo__black');
const tabletHeaderLogoWhite = document.querySelector('.tablet__header__logo__white');
const tabletHeaderNumberBlack = document.querySelector('.tablet__header__number__black');
const tabletHeaderNumberWhite = document.querySelector('.tablet__header__number__white');
const tabletHeaderMenuContainer = document.querySelector('.tablet__header__menu__container');
const tabletHeaderHr = document.querySelector('.tablet__header__hr');
const body = document.querySelector('body');
const tabletHeaderMenu = document.querySelector('#tablet__header__menu');
const curtain = document.querySelector('.curtain');


const tabletHeaderBurgerLogo = document.querySelector('.tablet__header__burger__logo');
if (tabletHeaderBurgerLogo) {
     
     tabletHeaderBurgerLogo.addEventListener("click", function (e) {
          tabletHeaderBurgerLogo.classList.toggle('_active');
          tabletHeaderBurgerHr1.classList.toggle('_active');
          tabletHeaderBurgerHr2.classList.toggle('_active');
          tabletHeaderLogoBlack.classList.toggle('_active');
          tabletHeaderLogoWhite.classList.toggle('_active');
          tabletHeaderNumberBlack.classList.toggle('_active');
          tabletHeaderNumberWhite.classList.toggle('_active');
          tabletHeaderHr.classList.toggle('_active');
          tabletHeaderMenuContainer.classList.toggle('_active');
          body.classList.toggle('_active');
          tabletHeaderMenu.classList.toggle('_active');
          curtain.classList.toggle('_active');
     });
}

const inputHome = document.querySelector('.input__home');
if (inputHome) {
     
     inputHome.addEventListener("click",function (e) {
          tabletHeaderBurgerLogo.classList.toggle('_active');
          tabletHeaderBurgerHr1.classList.toggle('_active');
          tabletHeaderBurgerHr2.classList.toggle('_active');
          tabletHeaderLogoBlack.classList.toggle('_active');
          tabletHeaderLogoWhite.classList.toggle('_active');
          tabletHeaderNumberBlack.classList.toggle('_active');
          tabletHeaderNumberWhite.classList.toggle('_active');
          tabletHeaderHr.classList.toggle('_active');
          tabletHeaderMenuContainer.classList.toggle('_active');
          body.classList.toggle('_active');
          tabletHeaderMenu.classList.toggle('_active');
          curtain.classList.toggle('_active');
     });
}

const inputAboutus = document.querySelector('.input__aboutus');
if (inputAboutus) {
     
     inputAboutus.addEventListener("click",function (e) {
          tabletHeaderBurgerLogo.classList.toggle('_active');
          tabletHeaderBurgerHr1.classList.toggle('_active');
          tabletHeaderBurgerHr2.classList.toggle('_active');
          tabletHeaderLogoBlack.classList.toggle('_active');
          tabletHeaderLogoWhite.classList.toggle('_active');
          tabletHeaderNumberBlack.classList.toggle('_active');
          tabletHeaderNumberWhite.classList.toggle('_active');
          tabletHeaderHr.classList.toggle('_active');
          tabletHeaderMenuContainer.classList.toggle('_active');
          body.classList.toggle('_active');
          tabletHeaderMenu.classList.toggle('_active');
          curtain.classList.toggle('_active');
     });
}

const inputGalary = document.querySelector('.input__galary');
if (inputGalary) {
     
     inputGalary.addEventListener("click",function (e) {
          tabletHeaderBurgerLogo.classList.toggle('_active');
          tabletHeaderBurgerHr1.classList.toggle('_active');
          tabletHeaderBurgerHr2.classList.toggle('_active');
          tabletHeaderLogoBlack.classList.toggle('_active');
          tabletHeaderLogoWhite.classList.toggle('_active');
          tabletHeaderNumberBlack.classList.toggle('_active');
          tabletHeaderNumberWhite.classList.toggle('_active');
          tabletHeaderHr.classList.toggle('_active');
          tabletHeaderMenuContainer.classList.toggle('_active');
          body.classList.toggle('_active');
          tabletHeaderMenu.classList.toggle('_active');
          curtain.classList.toggle('_active');
     });
}

const inputReviews = document.querySelector('.input__reviews');
if (inputReviews) {
     
     inputReviews.addEventListener("click",function (e) {
          tabletHeaderBurgerLogo.classList.toggle('_active');
          tabletHeaderBurgerHr1.classList.toggle('_active');
          tabletHeaderBurgerHr2.classList.toggle('_active');
          tabletHeaderLogoBlack.classList.toggle('_active');
          tabletHeaderLogoWhite.classList.toggle('_active');
          tabletHeaderNumberBlack.classList.toggle('_active');
          tabletHeaderNumberWhite.classList.toggle('_active');
          tabletHeaderHr.classList.toggle('_active');
          tabletHeaderMenuContainer.classList.toggle('_active');
          body.classList.toggle('_active');
          tabletHeaderMenu.classList.toggle('_active');
          curtain.classList.toggle('_active');
     });
}

const inputContacts = document.querySelector('.input__contacts');
if (inputContacts) {
     
     inputContacts.addEventListener("click",function (e) {
          tabletHeaderBurgerLogo.classList.toggle('_active');
          tabletHeaderBurgerHr1.classList.toggle('_active');
          tabletHeaderBurgerHr2.classList.toggle('_active');
          tabletHeaderLogoBlack.classList.toggle('_active');
          tabletHeaderLogoWhite.classList.toggle('_active');
          tabletHeaderNumberBlack.classList.toggle('_active');
          tabletHeaderNumberWhite.classList.toggle('_active');
          tabletHeaderHr.classList.toggle('_active');
          tabletHeaderMenuContainer.classList.toggle('_active');
          body.classList.toggle('_active');
          tabletHeaderMenu.classList.toggle('_active');
          curtain.classList.toggle('_active');
     });
}

const headerMenuHome = document.querySelector('.header__menu__home');
const headerMenuAboutus = document.querySelector('.header__menu__aboutus');
const headerMenuGalary = document.querySelector('.header__menu__galary');
const headerMenuReviews = document.querySelector('.header__menu__reviews');
const headerMenuContacts = document.querySelector('.header__menu__contacts');
const headerMenuHomeLink = document.querySelector('.header__menu__home__link');
const headerMenuAboutusLink = document.querySelector('.header__menu__aboutus__link');
const headerMenuGalaryLink = document.querySelector('.header__menu__galary__link');
const headerMenuReviewsLink = document.querySelector('.header__menu__reviews__link');
const headerMenuContactsLink = document.querySelector('.header__menu__contacts__link');

if (headerMenuHomeLink) {
     headerMenuHomeLink.addEventListener("click",function (e) {
          if (headerMenuHome.classList.contains('_active')) { }
          else {headerMenuHome.classList.toggle('_active')}
          if (headerMenuAboutus.classList.contains('_active')) { headerMenuAboutus.classList.remove('_active')}
          if (headerMenuGalary.classList.contains('_active')) { headerMenuGalary.classList.remove('_active')}
          if (headerMenuReviews.classList.contains('_active')) { headerMenuReviews.classList.remove('_active')}
          if (headerMenuContacts.classList.contains('_active')) { headerMenuContacts.classList.remove('_active')}
     });
}

if (headerMenuAboutusLink) {
     headerMenuAboutusLink.addEventListener("click",function (e) {
          if (headerMenuAboutus.classList.contains('_active')) { }
          else {headerMenuAboutus.classList.toggle('_active')}
          if (headerMenuHome.classList.contains('_active')) { headerMenuHome.classList.remove('_active')}
          if (headerMenuGalary.classList.contains('_active')) { headerMenuGalary.classList.remove('_active')}
          if (headerMenuReviews.classList.contains('_active')) { headerMenuReviews.classList.remove('_active')}
          if (headerMenuContacts.classList.contains('_active')) { headerMenuContacts.classList.remove('_active')}
     });
}

if (headerMenuGalaryLink) {
     headerMenuGalaryLink.addEventListener("click",function (e) {
          if (headerMenuGalary.classList.contains('_active')) { }
          else {headerMenuGalary.classList.toggle('_active')}
          if (headerMenuHome.classList.contains('_active')) { headerMenuHome.classList.remove('_active')}
          if (headerMenuAboutus.classList.contains('_active')) { headerMenuAboutus.classList.remove('_active')}
          if (headerMenuReviews.classList.contains('_active')) { headerMenuReviews.classList.remove('_active')}
          if (headerMenuContacts.classList.contains('_active')) { headerMenuContacts.classList.remove('_active')}
     });
}

if (headerMenuReviewsLink) {
     headerMenuReviewsLink.addEventListener("click",function (e) {
          if (headerMenuReviews.classList.contains('_active')) { }
          else {headerMenuReviews.classList.toggle('_active')}
          if (headerMenuHome.classList.contains('_active')) { headerMenuHome.classList.remove('_active')}
          if (headerMenuAboutus.classList.contains('_active')) { headerMenuAboutus.classList.remove('_active')}
          if (headerMenuGalary.classList.contains('_active')) { headerMenuGalary.classList.remove('_active')}
          if (headerMenuContacts.classList.contains('_active')) { headerMenuContacts.classList.remove('_active')}
     });
}

if (headerMenuContactsLink) {
     headerMenuContactsLink.addEventListener("click",function (e) {
          if (headerMenuContacts.classList.contains('_active')) { }
          else {headerMenuContacts.classList.toggle('_active')}
          if (headerMenuHome.classList.contains('_active')) { headerMenuHome.classList.remove('_active')}
          if (headerMenuAboutus.classList.contains('_active')) { headerMenuAboutus.classList.remove('_active')}
          if (headerMenuGalary.classList.contains('_active')) { headerMenuGalary.classList.remove('_active')}
          if (headerMenuReviews.classList.contains('_active')) { headerMenuReviews.classList.remove('_active')}
     });
}



