const galaryFotoMenuKitchenText = document.querySelector('.galary__foto__menu__kitchen__text');
const galaryFotoMenuWardrobeText = document.querySelector('.galary__foto__menu__wardrobe__text');
const galaryFotoMenuOfficeFurnitureText = document.querySelector('.galary__foto__menu__officefurniture__text');
const galaryFotoMenuKitchen = document.querySelector('.galary__foto__menu__kitchen');
const galaryFotoMenuWardrobe = document.querySelector('.galary__foto__menu__wardrobe');
const galaryFotoMenuOfficeFurniture = document.querySelector('.galary__foto__menu__officefurniture');
const galaryFoto1Container = document.querySelector('.galary__foto__1__container');
const galaryFoto2Container = document.querySelector('.galary__foto__2__container');
const galaryFoto3Container = document.querySelector('.galary__foto__3__container');
const galaryFoto4Container = document.querySelector('.galary__foto__4__container');
const galaryFoto5Container = document.querySelector('.galary__foto__5__container');

const galaryFoto6Container = document.querySelector('.galary__foto__6__container');
const galaryFoto7Container = document.querySelector('.galary__foto__7__container');
const galaryFoto8Container = document.querySelector('.galary__foto__8__container');
const galaryFoto9Container = document.querySelector('.galary__foto__9__container');

const galaryFoto10Container = document.querySelector('.galary__foto__10__container');
const galaryFoto11Container = document.querySelector('.galary__foto__11__container');
const galaryFoto12Container = document.querySelector('.galary__foto__12__container');


if (galaryFotoMenuKitchenText) {
     galaryFotoMenuKitchenText.addEventListener("click",function (e) {
          if (galaryFotoMenuKitchenText.classList.contains('_active')) { }
          else {galaryFotoMenuKitchenText.classList.toggle('_active')}
          if (galaryFotoMenuKitchen.classList.contains('_active')) { }
          else {galaryFotoMenuKitchen.classList.toggle('_active')}
          
          if (galaryFoto1Container.classList.contains('_active')) { }
          else {galaryFoto1Container.classList.toggle('_active')}
          if (galaryFoto2Container.classList.contains('_active')) { }
          else {galaryFoto2Container.classList.toggle('_active')}
          if (galaryFoto3Container.classList.contains('_active')) { }
          else {galaryFoto3Container.classList.toggle('_active')}
          if (galaryFoto4Container.classList.contains('_active')) { }
          else {galaryFoto4Container.classList.toggle('_active')}
          if (galaryFoto5Container.classList.contains('_active')) { }
          else {galaryFoto5Container.classList.toggle('_active')}

          if (galaryFoto6Container.classList.contains('_active')) {galaryFoto6Container.classList.remove('_active')}
          if (galaryFoto7Container.classList.contains('_active')) {galaryFoto7Container.classList.remove('_active')}
          if (galaryFoto8Container.classList.contains('_active')) {galaryFoto8Container.classList.remove('_active')}
          if (galaryFoto9Container.classList.contains('_active')) {galaryFoto9Container.classList.remove('_active')}

          if (galaryFoto10Container.classList.contains('_active')) {galaryFoto10Container.classList.remove('_active')}
          if (galaryFoto11Container.classList.contains('_active')) {galaryFoto11Container.classList.remove('_active')}
          if (galaryFoto12Container.classList.contains('_active')) {galaryFoto12Container.classList.remove('_active')}

          if (galaryFotoMenuWardrobeText.classList.contains('_active')) { galaryFotoMenuWardrobeText.classList.remove('_active')}
          if (galaryFotoMenuOfficeFurnitureText.classList.contains('_active')) { galaryFotoMenuOfficeFurnitureText.classList.remove('_active')}
          if (galaryFotoMenuWardrobe.classList.contains('_active')) { galaryFotoMenuWardrobe.classList.remove('_active')}
          if (galaryFotoMenuOfficeFurniture.classList.contains('_active')) { galaryFotoMenuOfficeFurniture.classList.remove('_active')}

     });
}

if (galaryFotoMenuWardrobeText) {
     galaryFotoMenuWardrobeText.addEventListener("click",function (e) {
          if (galaryFotoMenuWardrobeText.classList.contains('_active')) { }
          else {galaryFotoMenuWardrobeText.classList.toggle('_active')}
          if (galaryFotoMenuWardrobe.classList.contains('_active')) { }
          else {galaryFotoMenuWardrobe.classList.toggle('_active')}
          if (galaryFotoMenuKitchenText.classList.contains('_active')) { galaryFotoMenuKitchenText.classList.remove('_active')}
          if (galaryFotoMenuOfficeFurnitureText.classList.contains('_active')) { galaryFotoMenuOfficeFurnitureText.classList.remove('_active')}
          if (galaryFotoMenuKitchen.classList.contains('_active')) { galaryFotoMenuKitchen.classList.remove('_active')}
          if (galaryFotoMenuOfficeFurniture.classList.contains('_active')) { galaryFotoMenuOfficeFurniture.classList.remove('_active')}
          if (galaryFoto1Container.classList.contains('_active')) { galaryFoto1Container.classList.remove('_active')}
          if (galaryFoto2Container.classList.contains('_active')) { galaryFoto2Container.classList.remove('_active')}
          if (galaryFoto3Container.classList.contains('_active')) { galaryFoto3Container.classList.remove('_active')}
          if (galaryFoto4Container.classList.contains('_active')) { galaryFoto4Container.classList.remove('_active')}
          if (galaryFoto5Container.classList.contains('_active')) { galaryFoto5Container.classList.remove('_active')}

          if (galaryFoto10Container.classList.contains('_active')) {galaryFoto10Container.classList.remove('_active')}
          if (galaryFoto11Container.classList.contains('_active')) {galaryFoto11Container.classList.remove('_active')}
          if (galaryFoto12Container.classList.contains('_active')) {galaryFoto12Container.classList.remove('_active')}


          if (galaryFoto6Container.classList.contains('_active')) { }
          else {galaryFoto6Container.classList.toggle('_active')}
          if (galaryFoto7Container.classList.contains('_active')) { }
          else {galaryFoto7Container.classList.toggle('_active')}
          if (galaryFoto8Container.classList.contains('_active')) { }
          else {galaryFoto8Container.classList.toggle('_active')}
          if (galaryFoto9Container.classList.contains('_active')) { }
          else {galaryFoto9Container.classList.toggle('_active')}
     });
}

if (galaryFotoMenuOfficeFurnitureText) {
     galaryFotoMenuOfficeFurnitureText.addEventListener("click",function (e) {
          if (galaryFotoMenuOfficeFurnitureText.classList.contains('_active')) { }
          else {galaryFotoMenuOfficeFurnitureText.classList.toggle('_active')}
          if (galaryFotoMenuOfficeFurniture.classList.contains('_active')) { }
          else {galaryFotoMenuOfficeFurniture.classList.toggle('_active')}
          if (galaryFotoMenuKitchenText.classList.contains('_active')) { galaryFotoMenuKitchenText.classList.remove('_active')}
          if (galaryFotoMenuWardrobeText.classList.contains('_active')) { galaryFotoMenuWardrobeText.classList.remove('_active')}
          if (galaryFotoMenuKitchen.classList.contains('_active')) { galaryFotoMenuKitchen.classList.remove('_active')}
          if (galaryFotoMenuWardrobe.classList.contains('_active')) { galaryFotoMenuWardrobe.classList.remove('_active')}
          if (galaryFoto1Container.classList.contains('_active')) { galaryFoto1Container.classList.remove('_active')}
          if (galaryFoto2Container.classList.contains('_active')) { galaryFoto2Container.classList.remove('_active')}
          if (galaryFoto3Container.classList.contains('_active')) { galaryFoto3Container.classList.remove('_active')}
          if (galaryFoto4Container.classList.contains('_active')) { galaryFoto4Container.classList.remove('_active')}
          if (galaryFoto5Container.classList.contains('_active')) { galaryFoto5Container.classList.remove('_active')}

          if (galaryFoto6Container.classList.contains('_active')) {galaryFoto6Container.classList.remove('_active')}
          if (galaryFoto7Container.classList.contains('_active')) {galaryFoto7Container.classList.remove('_active')}
          if (galaryFoto8Container.classList.contains('_active')) {galaryFoto8Container.classList.remove('_active')}
          if (galaryFoto9Container.classList.contains('_active')) {galaryFoto9Container.classList.remove('_active')}

          if (galaryFoto10Container.classList.contains('_active')) { }
          else {galaryFoto10Container.classList.toggle('_active')}
          if (galaryFoto11Container.classList.contains('_active')) { }
          else {galaryFoto11Container.classList.toggle('_active')}
          if (galaryFoto12Container.classList.contains('_active')) { }
          else {galaryFoto12Container.classList.toggle('_active')}
          
     });



}

const tabletGalaryFotoMenuKitchenText = document.querySelector('.tablet__galary__foto__menu__kitchen__text');
const tabletGalaryFotoMenuWardrobeText = document.querySelector('.tablet__galary__foto__menu__wardrobe__text');
const tabletGalaryFotoMenuOfficeFurnitureText = document.querySelector('.tablet__galary__foto__menu__officefurniture__text');
const tabletGalaryFotoMenuKitchen = document.querySelector('.tablet__galary__foto__menu__kitchen');
const tabletGalaryFotoMenuWardrobe = document.querySelector('.tablet__galary__foto__menu__wardrobe');
const tabletGalaryFotoMenuOfficeFurniture = document.querySelector('.tablet__galary__foto__menu__officefurniture');

const tabletGalarySliderKitchen = document.querySelector('.tablet__galary__slider__kitchen');
const tabletGalarySliderWardrobe = document.querySelector('.tablet__galary__slider__wardrobe');
const tabletGalarySliderOffice = document.querySelector('.tablet__galary__slider__office');

if (tabletGalaryFotoMenuKitchenText) {
     tabletGalaryFotoMenuKitchenText.addEventListener("click",function (e) {
          if (tabletGalaryFotoMenuKitchenText.classList.contains('_active')) { }
          else {tabletGalaryFotoMenuKitchenText.classList.toggle('_active')}
          if (tabletGalaryFotoMenuKitchen.classList.contains('_active')) { }
          else {tabletGalaryFotoMenuKitchen.classList.toggle('_active')}
          
          if (tabletGalaryFotoMenuWardrobeText.classList.contains('_active')) { tabletGalaryFotoMenuWardrobeText.classList.remove('_active')}
          if (tabletGalaryFotoMenuOfficeFurnitureText.classList.contains('_active')) { tabletGalaryFotoMenuOfficeFurnitureText.classList.remove('_active')}
          if (tabletGalaryFotoMenuWardrobe.classList.contains('_active')) { tabletGalaryFotoMenuWardrobe.classList.remove('_active')}
          if (tabletGalaryFotoMenuOfficeFurniture.classList.contains('_active')) { tabletGalaryFotoMenuOfficeFurniture.classList.remove('_active')}
          
          if (tabletGalarySliderKitchen.classList.contains('_active')) {}
          else {tabletGalarySliderKitchen.classList.toggle('_active')}

          if (tabletGalarySliderWardrobe.classList.contains('_active')) { tabletGalarySliderWardrobe.classList.remove('_active') }
          if (tabletGalarySliderOffice.classList.contains('_active')) { tabletGalarySliderOffice.classList.remove('_active') }
          
          

     });
}

if (tabletGalaryFotoMenuWardrobeText) {
     tabletGalaryFotoMenuWardrobeText.addEventListener("click",function (e) {
          if (tabletGalaryFotoMenuWardrobeText.classList.contains('_active')) { }
          else {tabletGalaryFotoMenuWardrobeText.classList.toggle('_active')}
          if (tabletGalaryFotoMenuWardrobe.classList.contains('_active')) { }
          else {tabletGalaryFotoMenuWardrobe.classList.toggle('_active')}

          if (tabletGalaryFotoMenuKitchenText.classList.contains('_active')) { tabletGalaryFotoMenuKitchenText.classList.remove('_active')}
          if (tabletGalaryFotoMenuOfficeFurnitureText.classList.contains('_active')) { tabletGalaryFotoMenuOfficeFurnitureText.classList.remove('_active')}
          if (tabletGalaryFotoMenuKitchen.classList.contains('_active')) { tabletGalaryFotoMenuKitchen.classList.remove('_active')}
          if (tabletGalaryFotoMenuOfficeFurniture.classList.contains('_active')) { tabletGalaryFotoMenuOfficeFurniture.classList.remove('_active')}
          
          if (tabletGalarySliderWardrobe.classList.contains('_active')) {}
          else {tabletGalarySliderWardrobe.classList.toggle('_active')}

          if (tabletGalarySliderKitchen.classList.contains('_active')) { tabletGalarySliderKitchen.classList.remove('_active') }
          if (tabletGalarySliderOffice.classList.contains('_active')) { tabletGalarySliderOffice.classList.remove('_active') }
          
          
     });
}

if (tabletGalaryFotoMenuOfficeFurnitureText) {
     tabletGalaryFotoMenuOfficeFurnitureText.addEventListener("click",function (e) {
          if (tabletGalaryFotoMenuOfficeFurnitureText.classList.contains('_active')) { }
          else {tabletGalaryFotoMenuOfficeFurnitureText.classList.toggle('_active')}
          if (tabletGalaryFotoMenuOfficeFurniture.classList.contains('_active')) { }
          else {tabletGalaryFotoMenuOfficeFurniture.classList.toggle('_active')}
          
          if (tabletGalaryFotoMenuKitchenText.classList.contains('_active')) { tabletGalaryFotoMenuKitchenText.classList.remove('_active')}
          if (tabletGalaryFotoMenuWardrobeText.classList.contains('_active')) { tabletGalaryFotoMenuWardrobeText.classList.remove('_active')}
          if (tabletGalaryFotoMenuKitchen.classList.contains('_active')) { tabletGalaryFotoMenuKitchen.classList.remove('_active')}
          if (tabletGalaryFotoMenuWardrobe.classList.contains('_active')) { tabletGalaryFotoMenuWardrobe.classList.remove('_active')}
     
          if (tabletGalarySliderOffice.classList.contains('_active')) {}
          else {tabletGalarySliderOffice.classList.toggle('_active')}

          if (tabletGalarySliderKitchen.classList.contains('_active')) { tabletGalarySliderKitchen.classList.remove('_active') }
          if (tabletGalarySliderWardrobe.classList.contains('_active')) { tabletGalarySliderWardrobe.classList.remove('_active') }
          
     });
}

const tabletGalaryKitchenSliderImg1 = document.querySelector('.tablet__galary__kitchen__slide1__img');
const tabletGalaryKitchenSliderImg2 = document.querySelector('.tablet__galary__kitchen__slide2__img');
const tabletGalaryKitchenSliderImg3 = document.querySelector('.tablet__galary__kitchen__slide3__img');
const tabletGalaryKitchenSliderImg4 = document.querySelector('.tablet__galary__kitchen__slide4__img');
const tabletGalaryKitchenSliderImg5 = document.querySelector('.tablet__galary__kitchen__slide5__img');

const tabletGalaryKitchenLine1 = document.querySelector('.tablet__galary__kitchen__line__1');
const tabletGalaryKitchenLine2 = document.querySelector('.tablet__galary__kitchen__line__2');
const tabletGalaryKitchenLine3 = document.querySelector('.tablet__galary__kitchen__line__3');
const tabletGalaryKitchenLine4 = document.querySelector('.tablet__galary__kitchen__line__4');
const tabletGalaryKitchenLine5 = document.querySelector('.tablet__galary__kitchen__line__5');


const tabletGalarySliderKitchenButtonLeftImg = document.querySelector('.tablet__galary__slider__kitchen__button__left__img');
if (tabletGalarySliderKitchenButtonLeftImg) {

     tabletGalarySliderKitchenButtonLeftImg.addEventListener("click", function (e) {
          if (tabletGalaryKitchenSliderImg1.classList.contains('_active')) { }
          if (tabletGalaryKitchenSliderImg2.classList.contains('_active')) {
               tabletGalaryKitchenSliderImg1.classList.toggle('_active')
               tabletGalaryKitchenSliderImg2.classList.remove('_active')

               tabletGalaryKitchenLine1.classList.toggle('_active')
               tabletGalaryKitchenLine2.classList.remove('_active') 
          }
          if (tabletGalaryKitchenSliderImg3.classList.contains('_active')) {
               tabletGalaryKitchenSliderImg2.classList.toggle('_active')
               tabletGalaryKitchenSliderImg3.classList.remove('_active')

               tabletGalaryKitchenLine2.classList.toggle('_active')
               tabletGalaryKitchenLine3.classList.remove('_active')
          }
          if (tabletGalaryKitchenSliderImg4.classList.contains('_active')) {
               tabletGalaryKitchenSliderImg3.classList.toggle('_active')
               tabletGalaryKitchenSliderImg4.classList.remove('_active')

               tabletGalaryKitchenLine3.classList.toggle('_active')
               tabletGalaryKitchenLine4.classList.remove('_active')
          }
          if (tabletGalaryKitchenSliderImg5.classList.contains('_active')) {
               tabletGalaryKitchenSliderImg4.classList.toggle('_active')
               tabletGalaryKitchenSliderImg5.classList.remove('_active')

               tabletGalaryKitchenLine4.classList.toggle('_active')
               tabletGalaryKitchenLine5.classList.remove('_active')
          }
          
     });
}

const tabletGalarySliderKitchenButtonRightImg = document.querySelector('.tablet__galary__kitchen__slider__button__right__img');
if (tabletGalarySliderKitchenButtonRightImg) {

     tabletGalarySliderKitchenButtonRightImg.addEventListener("click", function (e) {
          if (tabletGalaryKitchenSliderImg5.classList.contains('_active')) { }
          if (tabletGalaryKitchenSliderImg4.classList.contains('_active')) {
               tabletGalaryKitchenSliderImg5.classList.toggle('_active')
               tabletGalaryKitchenSliderImg4.classList.remove('_active')

               tabletGalaryKitchenLine5.classList.toggle('_active')
               tabletGalaryKitchenLine4.classList.remove('_active')
          }
          if (tabletGalaryKitchenSliderImg3.classList.contains('_active')) {
               tabletGalaryKitchenSliderImg4.classList.toggle('_active')
               tabletGalaryKitchenSliderImg3.classList.remove('_active')

               tabletGalaryKitchenLine4.classList.toggle('_active')
               tabletGalaryKitchenLine3.classList.remove('_active')
          }
          if (tabletGalaryKitchenSliderImg2.classList.contains('_active')) {
               tabletGalaryKitchenSliderImg3.classList.toggle('_active')
               tabletGalaryKitchenSliderImg2.classList.remove('_active')

               tabletGalaryKitchenLine3.classList.toggle('_active')
               tabletGalaryKitchenLine2.classList.remove('_active')
          }
          if (tabletGalaryKitchenSliderImg1.classList.contains('_active')) {
               tabletGalaryKitchenSliderImg2.classList.toggle('_active')
               tabletGalaryKitchenSliderImg1.classList.remove('_active')

               tabletGalaryKitchenLine2.classList.toggle('_active')
               tabletGalaryKitchenLine1.classList.remove('_active')
          }
     });
}

if (tabletGalaryKitchenLine1) {

     tabletGalaryKitchenLine1.addEventListener("click", function (e) {

          if (tabletGalaryKitchenSliderImg1.classList.contains('_active')) { }
          if (tabletGalaryKitchenSliderImg2.classList.contains('_active')) { 
               tabletGalaryKitchenSliderImg1.classList.toggle('_active')
               tabletGalaryKitchenSliderImg2.classList.remove('_active')
               
               tabletGalaryKitchenLine1.classList.toggle('_active')
               tabletGalaryKitchenLine2.classList.remove('_active')
          }
          if (tabletGalaryKitchenSliderImg3.classList.contains('_active')) { 
               tabletGalaryKitchenSliderImg1.classList.toggle('_active')
               tabletGalaryKitchenSliderImg3.classList.remove('_active')
               
               tabletGalaryKitchenLine1.classList.toggle('_active')
               tabletGalaryKitchenLine3.classList.remove('_active')
          }
          if (tabletGalaryKitchenSliderImg4.classList.contains('_active')) { 
               tabletGalaryKitchenSliderImg1.classList.toggle('_active')
               tabletGalaryKitchenSliderImg4.classList.remove('_active')
               
               tabletGalaryKitchenLine1.classList.toggle('_active')
               tabletGalaryKitchenLine4.classList.remove('_active')
          }
          if (tabletGalaryKitchenSliderImg5.classList.contains('_active')) { 
               tabletGalaryKitchenSliderImg1.classList.toggle('_active')
               tabletGalaryKitchenSliderImg5.classList.remove('_active')
               
               tabletGalaryKitchenLine1.classList.toggle('_active')
               tabletGalaryKitchenLine5.classList.remove('_active')
          }
     });
}

if (tabletGalaryKitchenLine2) {

     tabletGalaryKitchenLine2.addEventListener("click", function (e) {

          if (tabletGalaryKitchenSliderImg2.classList.contains('_active')) { }
          if (tabletGalaryKitchenSliderImg1.classList.contains('_active')) { 
               tabletGalaryKitchenSliderImg2.classList.toggle('_active')
               tabletGalaryKitchenSliderImg1.classList.remove('_active')
               
               tabletGalaryKitchenLine2.classList.toggle('_active')
               tabletGalaryKitchenLine1.classList.remove('_active')
          }
          if (tabletGalaryKitchenSliderImg3.classList.contains('_active')) { 
               tabletGalaryKitchenSliderImg2.classList.toggle('_active')
               tabletGalaryKitchenSliderImg3.classList.remove('_active')
               
               tabletGalaryKitchenLine2.classList.toggle('_active')
               tabletGalaryKitchenLine3.classList.remove('_active')
          }
          if (tabletGalaryKitchenSliderImg4.classList.contains('_active')) { 
               tabletGalaryKitchenSliderImg2.classList.toggle('_active')
               tabletGalaryKitchenSliderImg4.classList.remove('_active')
               
               tabletGalaryKitchenLine2.classList.toggle('_active')
               tabletGalaryKitchenLine4.classList.remove('_active')
          }
          if (tabletGalaryKitchenSliderImg5.classList.contains('_active')) { 
               tabletGalaryKitchenSliderImg2.classList.toggle('_active')
               tabletGalaryKitchenSliderImg5.classList.remove('_active')
               
               tabletGalaryKitchenLine2.classList.toggle('_active')
               tabletGalaryKitchenLine5.classList.remove('_active')
          }
     });
}

if (tabletGalaryKitchenLine3) {

     tabletGalaryKitchenLine3.addEventListener("click", function (e) {

          if (tabletGalaryKitchenSliderImg3.classList.contains('_active')) { }
          if (tabletGalaryKitchenSliderImg1.classList.contains('_active')) { 
               tabletGalaryKitchenSliderImg3.classList.toggle('_active')
               tabletGalaryKitchenSliderImg1.classList.remove('_active')
               
               tabletGalaryKitchenLine3.classList.toggle('_active')
               tabletGalaryKitchenLine1.classList.remove('_active')
          }
          if (tabletGalaryKitchenSliderImg2.classList.contains('_active')) { 
               tabletGalaryKitchenSliderImg3.classList.toggle('_active')
               tabletGalaryKitchenSliderImg2.classList.remove('_active')
               
               tabletGalaryKitchenLine3.classList.toggle('_active')
               tabletGalaryKitchenLine2.classList.remove('_active')
          }
          if (tabletGalaryKitchenSliderImg4.classList.contains('_active')) { 
               tabletGalaryKitchenSliderImg3.classList.toggle('_active')
               tabletGalaryKitchenSliderImg4.classList.remove('_active')
               
               tabletGalaryKitchenLine3.classList.toggle('_active')
               tabletGalaryKitchenLine4.classList.remove('_active')
          }
          if (tabletGalaryKitchenSliderImg5.classList.contains('_active')) { 
               tabletGalaryKitchenSliderImg3.classList.toggle('_active')
               tabletGalaryKitchenSliderImg5.classList.remove('_active')
               
               tabletGalaryKitchenLine3.classList.toggle('_active')
               tabletGalaryKitchenLine5.classList.remove('_active')
          }
     });
}

if (tabletGalaryKitchenLine4) {

     tabletGalaryKitchenLine4.addEventListener("click", function (e) {

          if (tabletGalaryKitchenSliderImg4.classList.contains('_active')) { }
          if (tabletGalaryKitchenSliderImg1.classList.contains('_active')) { 
               tabletGalaryKitchenSliderImg4.classList.toggle('_active')
               tabletGalaryKitchenSliderImg1.classList.remove('_active')
               
               tabletGalaryKitchenLine4.classList.toggle('_active')
               tabletGalaryKitchenLine1.classList.remove('_active')
          }
          if (tabletGalaryKitchenSliderImg2.classList.contains('_active')) { 
               tabletGalaryKitchenSliderImg4.classList.toggle('_active')
               tabletGalaryKitchenSliderImg2.classList.remove('_active')
               
               tabletGalaryKitchenLine4.classList.toggle('_active')
               tabletGalaryKitchenLine2.classList.remove('_active')
          }
          if (tabletGalaryKitchenSliderImg3.classList.contains('_active')) { 
               tabletGalaryKitchenSliderImg4.classList.toggle('_active')
               tabletGalaryKitchenSliderImg3.classList.remove('_active')
               
               tabletGalaryKitchenLine4.classList.toggle('_active')
               tabletGalaryKitchenLine3.classList.remove('_active')
          }
          if (tabletGalaryKitchenSliderImg5.classList.contains('_active')) { 
               tabletGalaryKitchenSliderImg4.classList.toggle('_active')
               tabletGalaryKitchenSliderImg5.classList.remove('_active')
               
               tabletGalaryKitchenLine4.classList.toggle('_active')
               tabletGalaryKitchenLine5.classList.remove('_active')
          }
     });
}

if (tabletGalaryKitchenLine5) {

     tabletGalaryKitchenLine5.addEventListener("click", function (e) {

          if (tabletGalaryKitchenSliderImg5.classList.contains('_active')) { }
          if (tabletGalaryKitchenSliderImg1.classList.contains('_active')) { 
               tabletGalaryKitchenSliderImg5.classList.toggle('_active')
               tabletGalaryKitchenSliderImg1.classList.remove('_active')
               
               tabletGalaryKitchenLine5.classList.toggle('_active')
               tabletGalaryKitchenLine1.classList.remove('_active')
          }
          if (tabletGalaryKitchenSliderImg2.classList.contains('_active')) { 
               tabletGalaryKitchenSliderImg5.classList.toggle('_active')
               tabletGalaryKitchenSliderImg2.classList.remove('_active')
               
               tabletGalaryKitchenLine5.classList.toggle('_active')
               tabletGalaryKitchenLine2.classList.remove('_active')
          }
          if (tabletGalaryKitchenSliderImg4.classList.contains('_active')) { 
               tabletGalaryKitchenSliderImg5.classList.toggle('_active')
               tabletGalaryKitchenSliderImg4.classList.remove('_active')
               
               tabletGalaryKitchenLine5.classList.toggle('_active')
               tabletGalaryKitchenLine4.classList.remove('_active')
          }
          if (tabletGalaryKitchenSliderImg3.classList.contains('_active')) { 
               tabletGalaryKitchenSliderImg5.classList.toggle('_active')
               tabletGalaryKitchenSliderImg3.classList.remove('_active')
               
               tabletGalaryKitchenLine5.classList.toggle('_active')
               tabletGalaryKitchenLine3.classList.remove('_active')
          }
     });
}

const tabletGalaryWardrobeSliderImg1 = document.querySelector('.tablet__galary__wardrobe__slide1__img');
const tabletGalaryWardrobeSliderImg2 = document.querySelector('.tablet__galary__wardrobe__slide2__img');
const tabletGalaryWardrobeSliderImg3 = document.querySelector('.tablet__galary__wardrobe__slide3__img');
const tabletGalaryWardrobeSliderImg4 = document.querySelector('.tablet__galary__wardrobe__slide4__img');

const tabletGalaryWardrobeLine1 = document.querySelector('.tablet__galary__wardrobe__line__1');
const tabletGalaryWardrobeLine2 = document.querySelector('.tablet__galary__wardrobe__line__2');
const tabletGalaryWardrobeLine3 = document.querySelector('.tablet__galary__wardrobe__line__3');
const tabletGalaryWardrobeLine4 = document.querySelector('.tablet__galary__wardrobe__line__4');


const tabletGalarySliderWardrobeButtonLeftImg = document.querySelector('.tablet__galary__slider__wardrobe__button__left__img');
if (tabletGalarySliderWardrobeButtonLeftImg) {

     tabletGalarySliderWardrobeButtonLeftImg.addEventListener("click", function (e) {
          if (tabletGalaryWardrobeSliderImg1.classList.contains('_active')) { }
          if (tabletGalaryWardrobeSliderImg2.classList.contains('_active')) {
               tabletGalaryWardrobeSliderImg1.classList.toggle('_active')
               tabletGalaryWardrobeSliderImg2.classList.remove('_active')

               tabletGalaryWardrobeLine1.classList.toggle('_active')
               tabletGalaryWardrobeLine2.classList.remove('_active')
          }
          if (tabletGalaryWardrobeSliderImg3.classList.contains('_active')) {
               tabletGalaryWardrobeSliderImg2.classList.toggle('_active')
               tabletGalaryWardrobeSliderImg3.classList.remove('_active')

               tabletGalaryWardrobeLine2.classList.toggle('_active')
               tabletGalaryWardrobeLine3.classList.remove('_active')
          }
          if (tabletGalaryWardrobeSliderImg4.classList.contains('_active')) {
               tabletGalaryWardrobeSliderImg3.classList.toggle('_active')
               tabletGalaryWardrobeSliderImg4.classList.remove('_active')

               tabletGalaryWardrobeLine3.classList.toggle('_active')
               tabletGalaryWardrobeLine4.classList.remove('_active')
          }
          
     });
}

const tabletGalarySliderWardrobeButtonRightImg = document.querySelector('.tablet__galary__wardrobe__slider__button__right__img');
if (tabletGalarySliderWardrobeButtonRightImg) {

     tabletGalarySliderWardrobeButtonRightImg.addEventListener("click", function (e) {
          if (tabletGalaryWardrobeSliderImg4.classList.contains('_active')) { }
          if (tabletGalaryWardrobeSliderImg3.classList.contains('_active')) {
               tabletGalaryWardrobeSliderImg4.classList.toggle('_active')
               tabletGalaryWardrobeSliderImg3.classList.remove('_active')

               tabletGalaryWardrobeLine4.classList.toggle('_active')
               tabletGalaryWardrobeLine3.classList.remove('_active')
          }
          if (tabletGalaryWardrobeSliderImg2.classList.contains('_active')) {
               tabletGalaryWardrobeSliderImg3.classList.toggle('_active')
               tabletGalaryWardrobeSliderImg2.classList.remove('_active')

               tabletGalaryWardrobeLine3.classList.toggle('_active')
               tabletGalaryWardrobeLine2.classList.remove('_active')
          }
          if (tabletGalaryWardrobeSliderImg1.classList.contains('_active')) {
               tabletGalaryWardrobeSliderImg2.classList.toggle('_active')
               tabletGalaryWardrobeSliderImg1.classList.remove('_active')

               tabletGalaryWardrobeLine2.classList.toggle('_active')
               tabletGalaryWardrobeLine1.classList.remove('_active')
          }
     });
}

if (tabletGalaryWardrobeLine1) {

     tabletGalaryWardrobeLine1.addEventListener("click", function (e) {

          if (tabletGalaryWardrobeSliderImg1.classList.contains('_active')) { }
          if (tabletGalaryWardrobeSliderImg2.classList.contains('_active')) { 
               tabletGalaryWardrobeSliderImg1.classList.toggle('_active')
               tabletGalaryWardrobeSliderImg2.classList.remove('_active')
               
               tabletGalaryWardrobeLine1.classList.toggle('_active')
               tabletGalaryWardrobeLine2.classList.remove('_active')
          }
          if (tabletGalaryWardrobeSliderImg3.classList.contains('_active')) { 
               tabletGalaryWardrobeSliderImg1.classList.toggle('_active')
               tabletGalaryWardrobeSliderImg3.classList.remove('_active')
               
               tabletGalaryWardrobeLine1.classList.toggle('_active')
               tabletGalaryWardrobeLine3.classList.remove('_active')
          }
          if (tabletGalaryWardrobeSliderImg4.classList.contains('_active')) { 
               tabletGalaryWardrobeSliderImg1.classList.toggle('_active')
               tabletGalaryWardrobeSliderImg4.classList.remove('_active')
               
               tabletGalaryWardrobeLine1.classList.toggle('_active')
               tabletGalaryWardrobeLine4.classList.remove('_active')
          }
          
     });
}

if (tabletGalaryWardrobeLine2) {

     tabletGalaryWardrobeLine2.addEventListener("click", function (e) {

          if (tabletGalaryWardrobeSliderImg2.classList.contains('_active')) { }
          if (tabletGalaryWardrobeSliderImg1.classList.contains('_active')) { 
               tabletGalaryWardrobeSliderImg2.classList.toggle('_active')
               tabletGalaryWardrobeSliderImg1.classList.remove('_active')
               
               tabletGalaryWardrobeLine2.classList.toggle('_active')
               tabletGalaryWardrobeLine1.classList.remove('_active')
          }
          if (tabletGalaryWardrobeSliderImg3.classList.contains('_active')) { 
               tabletGalaryWardrobeSliderImg2.classList.toggle('_active')
               tabletGalaryWardrobeSliderImg3.classList.remove('_active')
               
               tabletGalaryWardrobeLine2.classList.toggle('_active')
               tabletGalaryWardrobeLine3.classList.remove('_active')
          }
          if (tabletGalaryWardrobeSliderImg4.classList.contains('_active')) { 
               tabletGalaryWardrobeSliderImg2.classList.toggle('_active')
               tabletGalaryWardrobeSliderImg4.classList.remove('_active')
               
               tabletGalaryWardrobeLine2.classList.toggle('_active')
               tabletGalaryWardrobeLine4.classList.remove('_active')
          }
          
     });
}

if (tabletGalaryWardrobeLine3) {

     tabletGalaryWardrobeLine3.addEventListener("click", function (e) {

          if (tabletGalaryWardrobeSliderImg3.classList.contains('_active')) { }
          if (tabletGalaryWardrobeSliderImg1.classList.contains('_active')) { 
               tabletGalaryWardrobeSliderImg3.classList.toggle('_active')
               tabletGalaryWardrobeSliderImg1.classList.remove('_active')
               
               tabletGalaryWardrobeLine3.classList.toggle('_active')
               tabletGalaryWardrobeLine1.classList.remove('_active')
          }
          if (tabletGalaryWardrobeSliderImg2.classList.contains('_active')) { 
               tabletGalaryWardrobeSliderImg3.classList.toggle('_active')
               tabletGalaryWardrobeSliderImg2.classList.remove('_active')
               
               tabletGalaryWardrobeLine3.classList.toggle('_active')
               tabletGalaryWardrobeLine2.classList.remove('_active')
          }
          if (tabletGalaryWardrobeSliderImg4.classList.contains('_active')) { 
               tabletGalaryWardrobeSliderImg3.classList.toggle('_active')
               tabletGalaryWardrobeSliderImg4.classList.remove('_active')
               
               tabletGalaryWardrobeLine3.classList.toggle('_active')
               tabletGalaryWardrobeLine4.classList.remove('_active')
          }
          
     });
}

if (tabletGalaryWardrobeLine4) {

     tabletGalaryWardrobeLine4.addEventListener("click", function (e) {

          if (tabletGalaryWardrobeSliderImg4.classList.contains('_active')) { }
          if (tabletGalaryWardrobeSliderImg1.classList.contains('_active')) { 
               tabletGalaryWardrobeSliderImg4.classList.toggle('_active')
               tabletGalaryWardrobeSliderImg1.classList.remove('_active')
               
               tabletGalaryWardrobeLine4.classList.toggle('_active')
               tabletGalaryWardrobeLine1.classList.remove('_active')
          }
          if (tabletGalaryWardrobeSliderImg2.classList.contains('_active')) { 
               tabletGalaryWardrobeSliderImg4.classList.toggle('_active')
               tabletGalaryWardrobeSliderImg2.classList.remove('_active')
               
               tabletGalaryWardrobeLine4.classList.toggle('_active')
               tabletGalaryWardrobeLine2.classList.remove('_active')
          }
          if (tabletGalaryWardrobeSliderImg3.classList.contains('_active')) { 
               tabletGalaryWardrobeSliderImg4.classList.toggle('_active')
               tabletGalaryWardrobeSliderImg3.classList.remove('_active')
               
               tabletGalaryWardrobeLine4.classList.toggle('_active')
               tabletGalaryWardrobeLine3.classList.remove('_active')
          }
          
     });
}

const tabletGalaryOfficeSliderImg1 = document.querySelector('.tablet__galary__office__slide1__img');
const tabletGalaryOfficeSliderImg2 = document.querySelector('.tablet__galary__office__slide2__img');
const tabletGalaryOfficeSliderImg3 = document.querySelector('.tablet__galary__office__slide3__img');

const tabletGalaryOfficeLine1 = document.querySelector('.tablet__galary__office__line__1');
const tabletGalaryOfficeLine2 = document.querySelector('.tablet__galary__office__line__2');
const tabletGalaryOfficeLine3 = document.querySelector('.tablet__galary__office__line__3');

const tabletGalarySliderOfficeButtonLeftImg = document.querySelector('.tablet__galary__slider__office__button__left__img');
if (tabletGalarySliderOfficeButtonLeftImg) {

     tabletGalarySliderOfficeButtonLeftImg.addEventListener("click", function (e) {
          if (tabletGalaryOfficeSliderImg1.classList.contains('_active')) { }
          if (tabletGalaryOfficeSliderImg2.classList.contains('_active')) {
               tabletGalaryOfficeSliderImg1.classList.toggle('_active')
               tabletGalaryOfficeSliderImg2.classList.remove('_active')

               tabletGalaryOfficeLine1.classList.toggle('_active')
               tabletGalaryOfficeLine2.classList.remove('_active')
          }
          if (tabletGalaryOfficeSliderImg3.classList.contains('_active')) {
               tabletGalaryOfficeSliderImg2.classList.toggle('_active')
               tabletGalaryOfficeSliderImg3.classList.remove('_active')

               tabletGalaryOfficeLine2.classList.toggle('_active')
               tabletGalaryOfficeLine3.classList.remove('_active')
          }
          
     });
}

const tabletGalarySliderOfficeButtonRightImg = document.querySelector('.tablet__galary__office__slider__button__right__img');
if (tabletGalarySliderOfficeButtonRightImg) {

     tabletGalarySliderOfficeButtonRightImg.addEventListener("click", function (e) {
          if (tabletGalaryOfficeSliderImg3.classList.contains('_active')) { }
          if (tabletGalaryOfficeSliderImg2.classList.contains('_active')) {
               tabletGalaryOfficeSliderImg3.classList.toggle('_active')
               tabletGalaryOfficeSliderImg2.classList.remove('_active')

               tabletGalaryOfficeLine3.classList.toggle('_active')
               tabletGalaryOfficeLine2.classList.remove('_active')
          }
          if (tabletGalaryOfficeSliderImg1.classList.contains('_active')) {
               tabletGalaryOfficeSliderImg2.classList.toggle('_active')
               tabletGalaryOfficeSliderImg1.classList.remove('_active')

               tabletGalaryOfficeLine2.classList.toggle('_active')
               tabletGalaryOfficeLine1.classList.remove('_active')
          }
          
     });
}

if (tabletGalaryOfficeLine1) {

     tabletGalaryOfficeLine1.addEventListener("click", function (e) {

          if (tabletGalaryOfficeSliderImg1.classList.contains('_active')) { }
          if (tabletGalaryOfficeSliderImg2.classList.contains('_active')) { 
               tabletGalaryOfficeSliderImg1.classList.toggle('_active')
               tabletGalaryOfficeSliderImg2.classList.remove('_active')
               
               tabletGalaryOfficeLine1.classList.toggle('_active')
               tabletGalaryOfficeLine2.classList.remove('_active')
          }
          if (tabletGalaryOfficeSliderImg3.classList.contains('_active')) { 
               tabletGalaryOfficeSliderImg1.classList.toggle('_active')
               tabletGalaryOfficeSliderImg3.classList.remove('_active')
               
               tabletGalaryOfficeLine1.classList.toggle('_active')
               tabletGalaryOfficeLine3.classList.remove('_active')
          }
          if (tabletGalaryOfficeSliderImg4.classList.contains('_active')) { 
               tabletGalaryOfficeSliderImg1.classList.toggle('_active')
               tabletGalaryOfficeSliderImg4.classList.remove('_active')
               
               tabletGalaryOfficeLine1.classList.toggle('_active')
               tabletGalaryOfficeLine4.classList.remove('_active')
          }
          
     });
}

if (tabletGalaryOfficeLine2) {

     tabletGalaryOfficeLine2.addEventListener("click", function (e) {

          if (tabletGalaryOfficeSliderImg2.classList.contains('_active')) { }
          if (tabletGalaryOfficeSliderImg1.classList.contains('_active')) { 
               tabletGalaryOfficeSliderImg2.classList.toggle('_active')
               tabletGalaryOfficeSliderImg1.classList.remove('_active')
               
               tabletGalaryOfficeLine2.classList.toggle('_active')
               tabletGalaryOfficeLine1.classList.remove('_active')
          }
          if (tabletGalaryOfficeSliderImg3.classList.contains('_active')) { 
               tabletGalaryOfficeSliderImg2.classList.toggle('_active')
               tabletGalaryOfficeSliderImg3.classList.remove('_active')
               
               tabletGalaryOfficeLine2.classList.toggle('_active')
               tabletGalaryOfficeLine3.classList.remove('_active')
          }
          if (tabletGalaryOfficeSliderImg4.classList.contains('_active')) { 
               tabletGalaryOfficeSliderImg2.classList.toggle('_active')
               tabletGalaryOfficeSliderImg4.classList.remove('_active')
               
               tabletGalaryOfficeLine2.classList.toggle('_active')
               tabletGalaryOfficeLine4.classList.remove('_active')
          }
          
     });
}

if (tabletGalaryOfficeLine3) {

     tabletGalaryOfficeLine3.addEventListener("click", function (e) {

          if (tabletGalaryOfficeSliderImg3.classList.contains('_active')) { }
          if (tabletGalaryOfficeSliderImg1.classList.contains('_active')) { 
               tabletGalaryOfficeSliderImg3.classList.toggle('_active')
               tabletGalaryOfficeSliderImg1.classList.remove('_active')
               
               tabletGalaryOfficeLine3.classList.toggle('_active')
               tabletGalaryOfficeLine1.classList.remove('_active')
          }
          if (tabletGalaryOfficeSliderImg2.classList.contains('_active')) { 
               tabletGalaryOfficeSliderImg3.classList.toggle('_active')
               tabletGalaryOfficeSliderImg2.classList.remove('_active')
               
               tabletGalaryOfficeLine3.classList.toggle('_active')
               tabletGalaryOfficeLine2.classList.remove('_active')
          }
          if (tabletGalaryOfficeSliderImg4.classList.contains('_active')) { 
               tabletGalaryOfficeSliderImg3.classList.toggle('_active')
               tabletGalaryOfficeSliderImg4.classList.remove('_active')
               
               tabletGalaryOfficeLine3.classList.toggle('_active')
               tabletGalaryOfficeLine4.classList.remove('_active')
          }
          
     });
}