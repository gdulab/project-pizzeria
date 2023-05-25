// import Flickity from "flickity";

import { select } from '../settings.js';

class Home {
  constructor() {
    const thisHome = this;

    thisHome.getElements();
    thisHome.initWidgets();
  }

  getElements() {
    const thisHome = this;

    thisHome.likeButtons = document.querySelectorAll(select.home.gallery.likeButton);
  }

  initWidgets() {
    const thisHome = this;

    for (let likeButton of thisHome.likeButtons) {
      likeButton.addEventListener('click', function () {
        likeButton.classList.toggle('liked');
      });
    }
  }

}

export default Home;