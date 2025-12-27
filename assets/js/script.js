// Custom JavaScript for QC Grant Website

// Header scroll behavior
const headerWrapper = document.querySelector('.header-wrapper');
if (headerWrapper) {
  let lastScroll = 0;
  
  window.onscroll = () => {
    // Add sticky class on scroll for visual effect
    const header = headerWrapper.querySelector('.header-nav');
    if (header && window.pageYOffset >= 50) {
      header.classList.add('header-sticky-top');
    } else if (header) {
      header.classList.remove('header-sticky-top');
    }
    
    // Keep header always visible (no hide on scroll)
    lastScroll = document.documentElement.scrollTop || document.body.scrollTop;
  };
}

// Initialize when page loads
window.onload = () => {
  // Hide preloader if it exists
  const preloader = document.querySelector('.preloader');
  if (preloader) {
    setTimeout(() => {
      preloader.classList.add('preloader-hide');
    }, 150);
  }
  
  // Initialize AOS (Animate On Scroll) if available
  if (typeof AOS !== 'undefined') {
    setTimeout(() => {
      AOS.init({
        duration: 600,
        once: true
      });
    }, 50);
  }
  
  // Video play button handling
  const videoPlay = document.querySelectorAll('.video-play-btn');
  videoPlay.forEach(function(video) {
    const thumbnail = video.nextElementSibling;
    if (thumbnail) {
      const thumbWidth = thumbnail.width;
      video.addEventListener('click', function() {
        const videoEl = '<div class="ratio ratio-16x9 mx-auto bg-dark overflow-hidden" style="max-width:' + 
                        thumbWidth + 'px"><iframe src="' + this.getAttribute('data-src') + 
                        '?autoplay=1&modestbranding=1&showinfo=0" allowscriptaccess="always" allow="autoplay" allowfullscreen></iframe></div>';
        this.parentNode.innerHTML = videoEl;
      });
    }
  });
  
  // Initialize Rellax if available and elements exist
  if (typeof Rellax !== 'undefined' && document.querySelectorAll('[data-rellax-speed]').length) {
    new Rellax('[data-rellax-speed]');
  }
  
  // Initialize Swiper carousels if available
  if (typeof Swiper !== 'undefined') {
    // Brand carousel
    if (document.querySelector('.brand-carousel')) {
      new Swiper('.brand-carousel', {
        spaceBetween: 0,
        speed: 1000,
        loop: true,
        autoplay: {
          delay: 3000,
        },
        breakpoints: {
          0: { slidesPerView: 2, spaceBetween: 0 },
          640: { slidesPerView: 3, spaceBetween: 0 },
          767: { slidesPerView: 3, spaceBetween: 0 },
          991: { slidesPerView: 5, spaceBetween: 0 }
        }
      });
    }
    
    // Features carousel
    if (document.querySelector('.features-carousel')) {
      new Swiper('.features-carousel', {
        spaceBetween: 0,
        speed: 600,
        autoplay: true,
        breakpoints: {
          0: { slidesPerView: 1, spaceBetween: 0 },
          575: { slidesPerView: 1, spaceBetween: 0 },
          767: { slidesPerView: 2, spaceBetween: 0 },
          991: { slidesPerView: 3, spaceBetween: 0 }
        },
        pagination: {
          el: '.swiper-pagination',
          dynamicBullets: true,
          clickable: true
        }
      });
    }
    
    // Testimonial carousel
    if (document.querySelector('.testimonial-carousel')) {
      new Swiper('.testimonial-carousel', {
        spaceBetween: 0,
        speed: 600,
        loop: true,
        autoplay: true,
        slidesPerView: 1,
        pagination: {
          el: '.swiper-pagination',
          dynamicBullets: true,
          clickable: true
        }
      });
    }
  }
};

// Form validation
(function() {
  'use strict';
  window.addEventListener('load', function() {
    const forms = document.getElementsByClassName('needs-validation');
    Array.prototype.filter.call(forms, function(form) {
      form.addEventListener('submit', function(event) {
        if (form.checkValidity() === false) {
          event.preventDefault();
          event.stopPropagation();
        }
        form.classList.add('was-validated');
      }, false);
    });
  }, false);
})();