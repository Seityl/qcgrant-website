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

// Mobile sidebar functionality
document.addEventListener('DOMContentLoaded', function() {
  const navbarToggler = document.querySelector('.navbar-toggler');
  const navbarCollapse = document.querySelector('#navbarNav');
  const backdrop = document.querySelector('.mobile-sidebar-backdrop');
  const closeBtn = document.querySelector('.sidebar-close-btn');
  
  if (navbarToggler && navbarCollapse && backdrop && closeBtn) {
    // Track the actual sidebar state
    let sidebarIsOpen = false;
    
    // Function to show/hide sidebar elements
    function toggleSidebar(show) {
      sidebarIsOpen = show;
      if (show) {
        backdrop.classList.add('show');
        closeBtn.classList.add('show');
        navbarToggler.classList.add('hide-toggler'); // Hide hamburger icon
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
      } else {
        backdrop.classList.remove('show');
        closeBtn.classList.remove('show');
        navbarToggler.classList.remove('hide-toggler'); // Show hamburger icon
        document.body.style.overflow = ''; // Restore scrolling
      }
    }
    
    // Stop propagation of dropdown collapse events to prevent interference
    const dropdownCollapses = navbarCollapse.querySelectorAll('.collapse');
    dropdownCollapses.forEach(dropdown => {
      dropdown.addEventListener('show.bs.collapse', function(e) {
        e.stopPropagation();
      });
      dropdown.addEventListener('shown.bs.collapse', function(e) {
        e.stopPropagation();
      });
      dropdown.addEventListener('hide.bs.collapse', function(e) {
        e.stopPropagation();
      });
      dropdown.addEventListener('hidden.bs.collapse', function(e) {
        e.stopPropagation();
      });
    });
    
    // Toggle sidebar when hamburger menu is clicked
    navbarToggler.addEventListener('click', function() {
      // Use Bootstrap's collapse events to detect when menu opens/closes
      setTimeout(() => {
        const isExpanded = navbarCollapse.classList.contains('show');
        toggleSidebar(isExpanded);
      }, 10);
    });
    
    // Close sidebar when backdrop is clicked
    backdrop.addEventListener('click', function() {
      if (sidebarIsOpen) {
        navbarToggler.click(); // Trigger the hamburger button to close
      }
    });
    
    // Close sidebar when close button is clicked
    closeBtn.addEventListener('click', function() {
      if (sidebarIsOpen) {
        navbarToggler.click(); // Trigger the hamburger button to close
      }
    });
    
    // Listen for Bootstrap collapse events ONLY on the main navbar
    navbarCollapse.addEventListener('shown.bs.collapse', function(e) {
      // Only handle if this is the main navbar collapse, not dropdown submenus
      if (e.target === navbarCollapse) {
        toggleSidebar(true);
      }
    });
    
    navbarCollapse.addEventListener('hidden.bs.collapse', function(e) {
      // Only handle if this is the main navbar collapse, not dropdown submenus
      if (e.target === navbarCollapse) {
        toggleSidebar(false);
      }
    });
  }

  // Observe stat-number elements and trigger count-up when they enter the viewport
  const statEls = document.querySelectorAll('.stat-number');

  if (statEls && statEls.length) {
    if ('IntersectionObserver' in window) {
      const statObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // stat entered view; trigger count up
            startCountUp(entry.target);
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.4 });
      statEls.forEach(el => statObserver.observe(el));
    } else {
      // Fallback: start all immediately
      statEls.forEach(startCountUp);
    }

    // Final timed fallback: trigger countups for any visible stats still at 0
    setTimeout(() => {
      statEls.forEach(el => {
        if (el.dataset.animated) return;
        try {
          const r = el.getBoundingClientRect();
          const inView = r.top < (window.innerHeight || document.documentElement.clientHeight) * 0.85 && r.bottom > (window.innerHeight || document.documentElement.clientHeight) * 0.15;
          if (inView) {
            // fallback triggering countup
            startCountUp(el);
          }
        } catch (e) {}
      });
    }, 700);
  }

  // Initialize AOS (Animate On Scroll) if available
  if (typeof AOS !== 'undefined') {
    setTimeout(() => {
      AOS.init({
        duration: 700,
        easing: 'ease-out-cubic',
        once: true,
        offset: 120,
        // Respect reduced-motion preferences
        disable: function() { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
      });

      // Debug: confirm AOS initialized in browser console
      // AOS initialized (silent)

      // Listen for AOS 'in' events to trigger animated behaviors (count-ups, etc.)
      document.addEventListener('aos:in', function(e) {
        const el = e.detail;
        if (!el) return;
        // Count-up numbers inside the element
        const stats = el.querySelectorAll ? el.querySelectorAll('.stat-number') : [];
        stats.forEach(startCountUp);
      });
    }, 50);
  }

  // Count-up helper
  function formatNumber(val, format) {
    if (format === 'currency-short') {
      if (val >= 1000000) return '$' + (val / 1000000).toFixed(2).replace(/\.00$/, '') + 'M';
      if (val >= 1000) return '$' + (val / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
      return '$' + val.toString();
    }
    return Math.round(val).toLocaleString();
  }

  function startCountUp(el) {
    if (!el || el.dataset.animated) return;
    // startCountUp triggered
    const raw = (el.dataset.target || '').toString().trim();
    const format = el.dataset.format || '';

    // Parse numeric target and suffixes (percent, currency, short multipliers, trailing words)
    function parseRaw(s) {
      if (!s) return { numeric: false };
      // percent e.g. "68%"
      if (/^[-+]?\d[\d,\.]*\s*%$/.test(s)) {
        const n = Number(s.replace(/[^0-9.\-]/g, ''));
        return { numeric: true, target: n, style: 'percent' };
      }
      // currency with multiplier e.g. "$4.45M"
      const currencyMatch = s.match(/^\$\s*([0-9,]+(?:\.[0-9]+)?)\s*([kKmM])?$/);
      if (currencyMatch) {
        let num = Number(currencyMatch[1].replace(/,/g, ''));
        const suf = (currencyMatch[2] || '').toLowerCase();
        if (suf === 'k') num *= 1e3;
        if (suf === 'm') num *= 1e6;
        return { numeric: true, target: num, style: 'currency' };
      }
      // plain leading number with optional trailing text e.g. "287 days" or "24/7"
      const leadMatch = s.match(/^([0-9,]+(?:\.[0-9]+)?)(?:\s*(.*))?$/);
      if (leadMatch) {
        const num = Number(leadMatch[1].replace(/,/g, ''));
        const tail = (leadMatch[2] || '').trim();
        if (!isNaN(num)) return { numeric: true, target: num, style: tail ? 'suffix' : 'number', suffix: tail };
      }
      return { numeric: false };
    }

    const parsed = parseRaw(raw);
    if (!parsed.numeric) {
      // Non-numeric or complex string: display as-is (no animation)
      el.textContent = raw;
      el.dataset.animated = '1';
      return;
    }

    el.dataset.animated = '1';
    const target = parsed.target;
    // Allow per-element override with data-duration (milliseconds), default to a slower 2500ms
    const duration = (el.dataset && el.dataset.duration) ? Number(el.dataset.duration) : 2500;
    // count-up duration: silently using -> duration
    let startTime = null;

    function step(ts) {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const value = Math.floor(progress * target);

      // Render based on style
      if (parsed.style === 'percent') {
        el.textContent = Math.round(value) + '%';
      } else if (parsed.style === 'currency') {
        el.textContent = formatNumber(value, 'currency-short');
      } else if (parsed.style === 'suffix') {
        el.textContent = Math.round(value).toLocaleString() + (parsed.suffix ? ' ' + parsed.suffix : '');
      } else {
        el.textContent = Math.round(value).toLocaleString();
      }

      if (progress < 1) requestAnimationFrame(step);
      else {
        // Final value
        if (parsed.style === 'percent') el.textContent = Math.round(target) + '%';
        else if (parsed.style === 'currency') el.textContent = formatNumber(target, 'currency-short');
        else if (parsed.style === 'suffix') el.textContent = Math.round(target).toLocaleString() + (parsed.suffix ? ' ' + parsed.suffix : '');
        else el.textContent = Math.round(target).toLocaleString();
      }
    }

    requestAnimationFrame(step);
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
});

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