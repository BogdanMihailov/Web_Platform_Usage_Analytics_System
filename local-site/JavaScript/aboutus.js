const aboutusSlide1Img = document.querySelector('.aboutus__slide1__img');
const aboutusSlide2Img = document.querySelector('.aboutus__slide2__img');
const aboutusSlide3Img = document.querySelector('.aboutus__slide3__img');

const aboutusSliderTextContainer1 = document.querySelector('.aboutus__slider__text__container__1');
const aboutusSliderTextContainer2 = document.querySelector('.aboutus__slider__text__container__2');
const aboutusSliderTextContainer3 = document.querySelector('.aboutus__slider__text__container__3');

const aboutusSliderTextContainer1Tall = document.querySelector('.aboutus__slider__text__container__1__tall');
const aboutusSliderTextContainer2Tall = document.querySelector('.aboutus__slider__text__container__2__tall');
const aboutusSliderTextContainer3Tall = document.querySelector('.aboutus__slider__text__container__3__tall');

const aboutusSliderLine1 = document.querySelector('.aboutus__slider__line__1');
const aboutusSliderLine2 = document.querySelector('.aboutus__slider__line__2');
const aboutusSliderLine3 = document.querySelector('.aboutus__slider__line__3');



const aboutusSliderButtonUp = document.querySelector('.aboutus__slider__button__up');
if (aboutusSliderButtonUp) {

     aboutusSliderButtonUp.addEventListener("click", function (e) {
          if (aboutusSlide1Img.classList.contains('_active')) { }
          if (aboutusSlide2Img.classList.contains('_active')) {

               aboutusSlide1Img.classList.toggle('_active')
               aboutusSlide2Img.classList.remove('_active')

               aboutusSliderTextContainer1.classList.toggle('_active')
               aboutusSliderTextContainer2.classList.remove('_active')

               aboutusSliderTextContainer1Tall.classList.toggle('_active')
               aboutusSliderTextContainer2Tall.classList.remove('_active')
               
               aboutusSliderLine1.classList.toggle('_active')
               aboutusSliderLine2.classList.remove('_active')
          }
          if (aboutusSlide3Img.classList.contains('_active')) {
               
               aboutusSlide2Img.classList.toggle('_active')
               aboutusSlide3Img.classList.remove('_active')

               aboutusSliderTextContainer2.classList.toggle('_active')
               aboutusSliderTextContainer3.classList.remove('_active')

               aboutusSliderTextContainer2Tall.classList.toggle('_active')
               aboutusSliderTextContainer3Tall.classList.remove('_active')

               aboutusSliderLine2.classList.toggle('_active')
               aboutusSliderLine3.classList.remove('_active')
               
          }
          
          
     });
}


const aboutusSliderButtonDown = document.querySelector('.aboutus__slider__button__down');
if (aboutusSliderButtonDown) {

     aboutusSliderButtonDown.addEventListener("click", function (e) {
          if (aboutusSlide3Img.classList.contains('_active')) { }
          if (aboutusSlide2Img.classList.contains('_active')) {

               aboutusSlide3Img.classList.toggle('_active')
               aboutusSlide2Img.classList.remove('_active')

               aboutusSliderTextContainer3.classList.toggle('_active')
               aboutusSliderTextContainer2.classList.remove('_active')

               aboutusSliderTextContainer3Tall.classList.toggle('_active')
               aboutusSliderTextContainer2Tall.classList.remove('_active')

               aboutusSliderLine3.classList.toggle('_active')
               aboutusSliderLine2.classList.remove('_active') 
               
          }
          if (aboutusSlide1Img.classList.contains('_active')) {

               aboutusSlide2Img.classList.toggle('_active')
               aboutusSlide1Img.classList.remove('_active')

               aboutusSliderTextContainer2.classList.toggle('_active')
               aboutusSliderTextContainer1.classList.remove('_active')

               aboutusSliderTextContainer2Tall.classList.toggle('_active')
               aboutusSliderTextContainer1Tall.classList.remove('_active')

               aboutusSliderLine2.classList.toggle('_active')
               aboutusSliderLine1.classList.remove('_active')
               
          }
          
          
     });
}

const aboutusSliderButtonLeft = document.querySelector('.aboutus__slider__button__left');
if (aboutusSliderButtonLeft) {

     aboutusSliderButtonLeft.addEventListener("click", function (e) {
          if (aboutusSlide1Img.classList.contains('_active')) { }
          if (aboutusSlide2Img.classList.contains('_active')) {

               aboutusSlide1Img.classList.toggle('_active')
               aboutusSlide2Img.classList.remove('_active')

               aboutusSliderTextContainer1.classList.toggle('_active')
               aboutusSliderTextContainer2.classList.remove('_active')

               aboutusSliderTextContainer1Tall.classList.toggle('_active')
               aboutusSliderTextContainer2Tall.classList.remove('_active')
               
               aboutusSliderLine1.classList.toggle('_active')
               aboutusSliderLine2.classList.remove('_active') 
          }
          if (aboutusSlide3Img.classList.contains('_active')) {

               aboutusSlide2Img.classList.toggle('_active')
               aboutusSlide3Img.classList.remove('_active')

               aboutusSliderTextContainer2.classList.toggle('_active')
               aboutusSliderTextContainer3.classList.remove('_active')

               aboutusSliderTextContainer2Tall.classList.toggle('_active')
               aboutusSliderTextContainer3Tall.classList.remove('_active')
               
               aboutusSliderLine2.classList.toggle('_active')
               aboutusSliderLine3.classList.remove('_active')

          }
          
          
     });
}


const aboutusSliderButtonRight = document.querySelector('.aboutus__slider__button__right');
if (aboutusSliderButtonRight) {

     aboutusSliderButtonRight.addEventListener("click", function (e) {
          if (aboutusSlide3Img.classList.contains('_active')) { }
          if (aboutusSlide2Img.classList.contains('_active')) {

               aboutusSlide3Img.classList.toggle('_active')
               aboutusSlide2Img.classList.remove('_active')

               aboutusSliderTextContainer3.classList.toggle('_active')
               aboutusSliderTextContainer2.classList.remove('_active')

               aboutusSliderTextContainer3Tall.classList.toggle('_active')
               aboutusSliderTextContainer2Tall.classList.remove('_active')

               aboutusSliderLine3.classList.toggle('_active')
               aboutusSliderLine2.classList.remove('_active') 
          }
          if (aboutusSlide1Img.classList.contains('_active')) {

               aboutusSlide2Img.classList.toggle('_active')
               aboutusSlide1Img.classList.remove('_active')

               aboutusSliderTextContainer2.classList.toggle('_active')
               aboutusSliderTextContainer1.classList.remove('_active')

               aboutusSliderTextContainer2Tall.classList.toggle('_active')
               aboutusSliderTextContainer1Tall.classList.remove('_active')

               aboutusSliderLine2.classList.toggle('_active')
               aboutusSliderLine1.classList.remove('_active')

          }
          
          
     });
}

if (aboutusSliderLine1) {

     aboutusSliderLine1.addEventListener("click", function (e) {

          if (aboutusSlide1Img.classList.contains('_active')) { }
          if (aboutusSlide2Img.classList.contains('_active')) { 
               aboutusSlide1Img.classList.toggle('_active')
               aboutusSlide2Img.classList.remove('_active')

               aboutusSliderTextContainer1.classList.toggle('_active')
               aboutusSliderTextContainer2.classList.remove('_active')
               aboutusSliderTextContainer1Tall.classList.toggle('_active')
               aboutusSliderTextContainer2Tall.classList.remove('_active')
               
               aboutusSliderLine1.classList.toggle('_active')
               aboutusSliderLine2.classList.remove('_active')
          }
          if (aboutusSlide3Img.classList.contains('_active')) { 
               aboutusSlide1Img.classList.toggle('_active')
               aboutusSlide3Img.classList.remove('_active')
               aboutusSliderTextContainer1.classList.toggle('_active')
               aboutusSliderTextContainer3.classList.remove('_active')
               aboutusSliderTextContainer1Tall.classList.toggle('_active')
               aboutusSliderTextContainer3Tall.classList.remove('_active')
               aboutusSliderLine1.classList.toggle('_active')
               aboutusSliderLine3.classList.remove('_active')
          }

     });
}

if (aboutusSliderLine2) {

     aboutusSliderLine2.addEventListener("click", function (e) {

          if (aboutusSlide1Img.classList.contains('_active')) { 
               aboutusSlide2Img.classList.toggle('_active')
               aboutusSlide1Img.classList.remove('_active')
               aboutusSliderTextContainer2.classList.toggle('_active')
               aboutusSliderTextContainer1.classList.remove('_active')
               aboutusSliderTextContainer2Tall.classList.toggle('_active')
               aboutusSliderTextContainer1Tall.classList.remove('_active')
               aboutusSliderLine2.classList.toggle('_active')
               aboutusSliderLine1.classList.remove('_active')
          }
          if (aboutusSlide2Img.classList.contains('_active')) { }
          if (aboutusSlide3Img.classList.contains('_active')) { 
               aboutusSlide2Img.classList.toggle('_active')
               aboutusSlide3Img.classList.remove('_active')
               aboutusSliderTextContainer2.classList.toggle('_active')
               aboutusSliderTextContainer3.classList.remove('_active')
               aboutusSliderTextContainer2Tall.classList.toggle('_active')
               aboutusSliderTextContainer3Tall.classList.remove('_active')
               aboutusSliderLine2.classList.toggle('_active')
               aboutusSliderLine3.classList.remove('_active')
          }

     });
}

if (aboutusSliderLine3) {

     aboutusSliderLine3.addEventListener("click", function (e) {

          if (aboutusSlide1Img.classList.contains('_active')) { 
               aboutusSlide3Img.classList.toggle('_active')
               aboutusSlide1Img.classList.remove('_active')
               aboutusSliderTextContainer3.classList.toggle('_active')
               aboutusSliderTextContainer1.classList.remove('_active')
               aboutusSliderTextContainer3Tall.classList.toggle('_active')
               aboutusSliderTextContainer1Tall.classList.remove('_active')
               aboutusSliderLine3.classList.toggle('_active')
               aboutusSliderLine1.classList.remove('_active')
          }
          if (aboutusSlide2Img.classList.contains('_active')) { 
               aboutusSlide3Img.classList.toggle('_active')
               aboutusSlide2Img.classList.remove('_active')
               aboutusSliderTextContainer3.classList.toggle('_active')
               aboutusSliderTextContainer2.classList.remove('_active')
               aboutusSliderTextContainer3Tall.classList.toggle('_active')
               aboutusSliderTextContainer2Tall.classList.remove('_active')
               aboutusSliderLine3.classList.toggle('_active')
               aboutusSliderLine2.classList.remove('_active')
          }
          if (aboutusSlide3Img.classList.contains('_active')) { }

     });
}

const tabletAboutusSliderLine1 = document.querySelector('.tablet__aboutus__line__1');
const tabletAboutusSliderLine2 = document.querySelector('.tablet__aboutus__line__2');
const tabletAboutusSliderLine3 = document.querySelector('.tablet__aboutus__line__3');

const tabletAboutusSliderImg1 = document.querySelector('.tablet__aboutus__slide1__img');
const tabletAboutusSliderImg2 = document.querySelector('.tablet__aboutus__slide2__img');
const tabletAboutusSliderImg3 = document.querySelector('.tablet__aboutus__slide3__img');

const tabletAboutusSliderButtonLeftImg = document.querySelector('.tablet__aboutus__slider__button__left__img');
if (tabletAboutusSliderButtonLeftImg) {

     tabletAboutusSliderButtonLeftImg.addEventListener("click", function (e) {
          if (tabletAboutusSliderImg1.classList.contains('_active')) { }
          if (tabletAboutusSliderImg2.classList.contains('_active')) {
               tabletAboutusSliderImg1.classList.toggle('_active')
               tabletAboutusSliderImg2.classList.remove('_active')

               tabletAboutusSliderLine1.classList.toggle('_active')
               tabletAboutusSliderLine2.classList.remove('_active') 
          }
          if (tabletAboutusSliderImg3.classList.contains('_active')) {
               tabletAboutusSliderImg2.classList.toggle('_active')
               tabletAboutusSliderImg3.classList.remove('_active')

               
               tabletAboutusSliderLine2.classList.toggle('_active')
               tabletAboutusSliderLine3.classList.remove('_active')

          }
          
          
     });
}

const tabletAboutusSliderButtonRightImg = document.querySelector('.tablet__aboutus__slider__button__right__img');
if (tabletAboutusSliderButtonRightImg) {

     tabletAboutusSliderButtonRightImg.addEventListener("click", function (e) {
          if (tabletAboutusSliderImg3.classList.contains('_active')) { }
          if (tabletAboutusSliderImg2.classList.contains('_active')) {
               tabletAboutusSliderImg3.classList.toggle('_active')
               tabletAboutusSliderImg2.classList.remove('_active')

               tabletAboutusSliderLine3.classList.toggle('_active')
               tabletAboutusSliderLine2.classList.remove('_active') 
          }
          if (tabletAboutusSliderImg1.classList.contains('_active')) {
               tabletAboutusSliderImg2.classList.toggle('_active')
               tabletAboutusSliderImg1.classList.remove('_active')

               tabletAboutusSliderLine2.classList.toggle('_active')
               tabletAboutusSliderLine1.classList.remove('_active') 
          }
          
          
     });
}
//
if (tabletAboutusSliderLine1) {

     tabletAboutusSliderLine1.addEventListener("click", function (e) {

          if (tabletAboutusSliderImg1.classList.contains('_active')) { }
          if (tabletAboutusSliderImg2.classList.contains('_active')) { 
               tabletAboutusSliderImg1.classList.toggle('_active')
               tabletAboutusSliderImg2.classList.remove('_active')
               
               tabletAboutusSliderLine1.classList.toggle('_active')
               tabletAboutusSliderLine2.classList.remove('_active')
          }
          if (tabletAboutusSliderImg3.classList.contains('_active')) { 
               tabletAboutusSliderImg1.classList.toggle('_active')
               tabletAboutusSliderImg3.classList.remove('_active')
               
               tabletAboutusSliderLine1.classList.toggle('_active')
               tabletAboutusSliderLine3.classList.remove('_active')
          }

     });
}

if (tabletAboutusSliderLine2) {

     tabletAboutusSliderLine2.addEventListener("click", function (e) {

          if (tabletAboutusSliderImg1.classList.contains('_active')) { 
               tabletAboutusSliderImg2.classList.toggle('_active')
               tabletAboutusSliderImg1.classList.remove('_active')
               
               tabletAboutusSliderLine2.classList.toggle('_active')
               tabletAboutusSliderLine1.classList.remove('_active')
          }
          if (tabletAboutusSliderImg2.classList.contains('_active')) { }
          if (tabletAboutusSliderImg3.classList.contains('_active')) { 

               tabletAboutusSliderImg2.classList.toggle('_active')
               tabletAboutusSliderImg3.classList.remove('_active')
               
               tabletAboutusSliderLine2.classList.toggle('_active')
               tabletAboutusSliderLine3.classList.remove('_active')
          }

     });
}

if (tabletAboutusSliderLine3) {

     tabletAboutusSliderLine3.addEventListener("click", function (e) {

          if (tabletAboutusSliderImg1.classList.contains('_active')) { 
               tabletAboutusSliderImg3.classList.toggle('_active')
               tabletAboutusSliderImg1.classList.remove('_active')
               
               tabletAboutusSliderLine3.classList.toggle('_active')
               tabletAboutusSliderLine1.classList.remove('_active')
          }
          if (tabletAboutusSliderImg2.classList.contains('_active')) { 
               tabletAboutusSliderImg3.classList.toggle('_active')
               tabletAboutusSliderImg2.classList.remove('_active')
               
               tabletAboutusSliderLine3.classList.toggle('_active')
               tabletAboutusSliderLine2.classList.remove('_active')
          }
          if (tabletAboutusSliderImg3.classList.contains('_active')) { }

     });
}

const tabletAboutusText2 = document.querySelector('.tablet__aboutus__text__2');

const tabletAboutusTextMore = document.querySelector('.tablet__aboutus__text__more');
const tabletAboutusTextLess = document.querySelector('.tablet__aboutus__text__less');

if (tabletAboutusTextMore) {

     tabletAboutusTextMore.addEventListener("click", function (e) {
          if (tabletAboutusText2.classList.contains('_active')) { }
          else {
          tabletAboutusTextLess.classList.toggle('_active')
          tabletAboutusTextMore.classList.remove('_active')
          tabletAboutusText2.classList.toggle('_active')
     }
          
          
     });
}

if (tabletAboutusTextLess) {

     tabletAboutusTextLess.addEventListener("click", function (e) {
          if (tabletAboutusText2.classList.contains('_active')) { 
               tabletAboutusText2.classList.remove('_active') 
               tabletAboutusTextMore.classList.toggle('_active') 
               tabletAboutusTextLess.classList.remove('_active')
          }
          
          
     });
}
