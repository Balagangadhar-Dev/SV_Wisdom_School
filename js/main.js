/**
 * ==============================================================================
 * SARASWATI VISHWA WISDOM SCHOOL (SVWS) — KHARADBWADI, PHALTAN
 * Modern Gurukul | CBSE Curriculum | Indian Values & Global Excellence
 * ==============================================================================
 *
 * File: main.js
 * Description: Production-ready Vanilla JavaScript bundle powering all
 *              interactive features, animations, accessibility, and form
 *              validation for the Saraswati Vishwa Wisdom School website.
 *
 * Architecture: Modular ES6+ components encapsulated within an application
 *               controller, featuring graceful fallbacks, defensive element
 *               queries, performance-optimized event throttling, and
 *               reusable IntersectionObserver utilities.
 *
 * Table of Contents:
 *  1. Global Configuration & Utilities (Throttle, Debounce, Observer)
 *  2. Preloader & Page Entry Controller
 *  3. Header & Sticky Navigation (Scroll Spy, Smooth Scroll, Mobile Toggle)
 *  4. Urgent Announcement Bar (Dismissal & Session Persistence)
 *  5. Hero Section (Parallax Layering & Dynamic Tagline Typewriter)
 *  6. Sanskrit Shloka Sacred Typography Reveal
 *  7. Metric Counter Statistics Animation
 *  8. Scroll-Triggered Reveal Animations (Directional & Staggered Delays)
 *  9. Academics Tabbed Interface Component
 * 10. Multi-Touch Responsive Image Carousel & Gallery
 * 11. Comprehensive Admission Enquiry Form Validation & Floating Labels
 * 12. Modal / Popup Dialog Controller (15s Auto-timer & CTA Triggers)
 * 13. Back-to-Top Floating Navigation Action
 * 14. Section Background Subtle Parallax Transitions
 * 15. Dynamic Copyright Footer & Application Bootstrap
 * ==============================================================================
 */

'use strict';

(function () {
  /**
   * ============================================================================
   * 1. GLOBAL CONFIGURATION & UTILITY HELPERS
   * ============================================================================
   */
  const SVWS_CONFIG = {
    scrollStickyThreshold: 100,
    backToTopThreshold: 500,
    autoModalDelay: 15000, // 15 seconds
    carouselAutoplayInterval: 5000, // 5 seconds
    counterDuration: 2200, // milliseconds
    typewriterSpeed: 75, // ms per char
    typewriterWordPause: 900, // pause between words
    storageKeys: {
      announcementDismissed: 'svws_announcement_hidden_session',
      modalDismissed: 'svws_enquiry_modal_dismissed',
      visitedSession: 'svws_session_active'
    }
  };

  /**
   * Lightweight utility toolbox for performance and DOM ergonomics
   */
  const Utils = {
    /**
     * Throttles function execution to run at most once per limit
     * @param {Function} func
     * @param {number} limit
     * @returns {Function}
     */
    throttle(func, limit = 16) {
      let inThrottle = false;
      return function (...args) {
        if (!inThrottle) {
          func.apply(this, args);
          inThrottle = true;
          setTimeout(() => {
            inThrottle = false;
          }, limit);
        }
      };
    },

    /**
     * Debounces function execution until wait milliseconds have elapsed
     * @param {Function} func
     * @param {number} wait
     * @returns {Function}
     */
    debounce(func, wait = 100) {
      let timeout;
      return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
      };
    },

    /**
     * Easing calculation (easeOutExpo) for ultra-smooth count-up physics
     * @param {number} x progress from 0 to 1
     * @returns {number}
     */
    easeOutExpo(x) {
      return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
    },

    /**
     * Ease-out quadratic calculation
     * @param {number} t
     * @returns {number}
     */
    easeOutQuad(t) {
      return t * (2 - t);
    },

    /**
     * Sanitizes string for safe DOM text insertion
     * @param {string} str
     * @returns {string}
     */
    escapeHTML(str) {
      if (typeof str !== 'string') return '';
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    },

    /**
     * Safe querySelector shorthand
     * @param {string} selector
     * @param {Element|Document} scope
     * @returns {Element|null}
     */
    $(selector, scope = document) {
      try {
        return scope.querySelector(selector);
      } catch (e) {
        console.warn(`[SVWS] Invalid selector: ${selector}`, e);
        return null;
      }
    },

    /**
     * Safe querySelectorAll shorthand returning an Array
     * @param {string} selector
     * @param {Element|Document} scope
     * @returns {Element[]}
     */
    $$(selector, scope = document) {
      try {
        return Array.from(scope.querySelectorAll(selector));
      } catch (e) {
        console.warn(`[SVWS] Invalid selector: ${selector}`, e);
        return [];
      }
    }
  };

  /**
   * Reusable Intersection Observer Factory
   * Supports custom callbacks, one-time triggers, and responsive margins
   */
  const SVWSObserver = {
    /**
     * Observes one or multiple elements and invokes callback on intersection
     * @param {string|Element|Element[]} targets
     * @param {Function} onEnter Callback when intersecting
     * @param {Object} options IntersectionObserverInit options
     * @param {boolean} once Whether to automatically unobserve after first hit
     * @returns {IntersectionObserver|null}
     */
    create(targets, onEnter, options = {}, once = true) {
      if (!('IntersectionObserver' in window)) {
        // Fallback for ancient environments: execute immediately
        const elements = typeof targets === 'string'
          ? Utils.$$(targets)
          : Array.isArray(targets) ? targets : [targets];
        elements.forEach(el => el && onEnter(el, null));
        return null;
      }

      const defaultOptions = {
        root: null,
        rootMargin: '0px 0px -50px 0px',
        threshold: 0.15,
        ...options
      };

      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            onEnter(entry.target, entry);
            if (once) {
              obs.unobserve(entry.target);
            }
          }
        });
      }, defaultOptions);

      const elements = typeof targets === 'string'
        ? Utils.$$(targets)
        : Array.isArray(targets) ? targets : [targets];

      elements.forEach(el => {
        if (el instanceof Element) {
          observer.observe(el);
        }
      });

      return observer;
    }
  };

  /**
   * ============================================================================
   * 2. PRELOADER CONTROLLER
   * Handles preloader animation, page reveal, and graceful timeout fallback
   * ============================================================================
   */
  const Preloader = {
    init() {
      const preloader = Utils.$('#preloader') || Utils.$('.preloader') || Utils.$('[data-preloader]');
      if (!preloader) return;

      const dismiss = () => {
        if (preloader.classList.contains('fade-out') || preloader.classList.contains('loaded')) {
          return;
        }

        preloader.classList.add('fade-out', 'loaded');
        document.body.classList.add('page-loaded');

        // Allow smooth CSS transition before hiding completely
        setTimeout(() => {
          preloader.style.display = 'none';
          preloader.style.visibility = 'hidden';
          preloader.setAttribute('aria-hidden', 'true');
        }, 650);
      };

      // Fade out when window finishes loading resources
      if (document.readyState === 'complete') {
        setTimeout(dismiss, 150);
      } else {
        window.addEventListener('load', dismiss);
      }

      // Safeguard: Dismiss after 2.5 seconds regardless of slow media
      setTimeout(dismiss, 2500);
    }
  };

  /**
   * ============================================================================
   * 3. NAVIGATION CONTROLLER
   * Sticky navbar on scroll, active link spy, smooth scrolling, and mobile menu
   * ============================================================================
   */
  const Navigation = {
    init() {
      this.nav = Utils.$('nav') || Utils.$('.navbar') || Utils.$('.site-header');
      this.navToggle = Utils.$('.nav-toggle') || Utils.$('#nav-toggle') || Utils.$('.navbar-toggler');
      this.navMenu = Utils.$('.nav-menu') || Utils.$('.navbar-collapse') || Utils.$('.nav-links') || (this.nav ? Utils.$('ul', this.nav) : null);
      this.navLinks = Utils.$$('a[href^="#"]', this.nav || document);
      this.sections = Utils.$$('section[id], header[id]');

      this.bindStickyScroll();
      this.bindMobileMenu();
      this.bindSmoothScroll();
      this.bindScrollSpy();
    },

    bindStickyScroll() {
      if (!this.nav) return;

      const handleScroll = () => {
        const scrolled = window.scrollY || window.pageYOffset;
        if (scrolled > SVWS_CONFIG.scrollStickyThreshold) {
          if (!this.nav.classList.contains('scrolled')) {
            this.nav.classList.add('scrolled');
          }
        } else {
          if (this.nav.classList.contains('scrolled')) {
            this.nav.classList.remove('scrolled');
          }
        }
      };

      window.addEventListener('scroll', Utils.throttle(handleScroll, 20), { passive: true });
      handleScroll(); // Initial check on load
    },

    bindMobileMenu() {
      if (!this.navToggle) return;

      const toggleMenu = (open) => {
        const isOpen = typeof open === 'boolean'
          ? open
          : !this.nav.classList.contains('nav-open');

        this.nav.classList.toggle('nav-open', isOpen);
        if (this.navMenu) this.navMenu.classList.toggle('open', isOpen);
        this.navToggle.classList.toggle('is-active', isOpen);
        this.navToggle.setAttribute('aria-expanded', String(isOpen));

        // Prevent body scroll when mobile menu is full overlay
        if (window.innerWidth <= 992) {
          document.body.classList.toggle('no-scroll', isOpen);
        }
      };

      this.navToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMenu();
      });

      // Close menu when a link inside is clicked
      if (this.nav) {
        this.nav.addEventListener('click', (e) => {
          const clickedLink = e.target.closest('a');
          if (clickedLink) {
            toggleMenu(false);
          }
        });
      }

      // Close on escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.nav.classList.contains('nav-open')) {
          toggleMenu(false);
        }
      });

      // Close on outside click
      document.addEventListener('click', (e) => {
        if (this.nav.classList.contains('nav-open') && !this.nav.contains(e.target)) {
          toggleMenu(false);
        }
      });
    },

    bindSmoothScroll() {
      document.addEventListener('click', (e) => {
        const anchor = e.target.closest('a[href^="#"]');
        if (!anchor) return;

        const href = anchor.getAttribute('href');
        if (!href || href === '#' || href === '#!') return;

        const targetEl = Utils.$(href);
        if (!targetEl) return;

        e.preventDefault();

        // Calculate nav offset height dynamically
        const navHeight = this.nav ? this.nav.offsetHeight : 80;
        const targetPosition = targetEl.getBoundingClientRect().top + window.pageYOffset - navHeight;

        window.scrollTo({
          top: Math.max(0, targetPosition),
          behavior: 'smooth'
        });

        // Set URL hash cleanly without jumping
        if (history.pushState) {
          history.pushState(null, '', href);
        }

        // Accessibility focus shift
        targetEl.setAttribute('tabindex', '-1');
        targetEl.focus({ preventScroll: true });
      });
    },

    bindScrollSpy() {
      if (!this.sections.length || !this.navLinks.length) return;

      const updateActiveNav = () => {
        const scrollPosition = (window.scrollY || window.pageYOffset) + 160;

        let currentSectionId = '';
        this.sections.forEach(section => {
          const top = section.offsetTop;
          const height = section.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            currentSectionId = section.getAttribute('id');
          }
        });

        if (!currentSectionId) return;

        this.navLinks.forEach(link => {
          const href = link.getAttribute('href');
          const isMatch = href === `#${currentSectionId}`;
          link.classList.toggle('active', isMatch);
          if (isMatch) {
            link.setAttribute('aria-current', 'page');
          } else {
            link.removeAttribute('aria-current');
          }
        });
      };

      window.addEventListener('scroll', Utils.throttle(updateActiveNav, 50), { passive: true });
      updateActiveNav();
    }
  };

  /**
   * ============================================================================
   * 4. ANNOUNCEMENT BAR CONTROLLER
   * Notice bar with close dismiss button and session storage persistence
   * ============================================================================
   */
  const AnnouncementBar = {
    init() {
      const bar = Utils.$('.announcement-bar') || Utils.$('#announcement-bar');
      const closeBtn = Utils.$('.announcement-close') || (bar ? Utils.$('button', bar) : null);

      if (!bar) return;

      // Check if user already dismissed it this session
      try {
        if (sessionStorage.getItem(SVWS_CONFIG.storageKeys.announcementDismissed) === 'true') {
          bar.style.display = 'none';
          return;
        }
      } catch (e) {
        // Fallback if sessionStorage is disabled
      }

      if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
          e.preventDefault();
          bar.style.transition = 'all 0.35s ease';
          bar.style.opacity = '0';
          bar.style.transform = 'translateY(-100%)';

          setTimeout(() => {
            bar.style.display = 'none';
            try {
              sessionStorage.setItem(SVWS_CONFIG.storageKeys.announcementDismissed, 'true');
            } catch (err) {}
          }, 350);
        });
      }
    }
  };

  /**
   * ============================================================================
   * 5. HERO SECTION CONTROLLER
   * Parallax background depth on scroll & Typewriter animation for tagline
   * Tagline: "Learn • Build • Compete • Lead • Serve"
   * ============================================================================
   */
  const HeroSection = {
    init() {
      this.initParallax();
      this.initTypewriter();
    },

    initParallax() {
      const hero = Utils.$('.hero') || Utils.$('#hero') || Utils.$('.hero-section');
      const heroBg = Utils.$('.hero-bg') || Utils.$('.hero-background') || Utils.$('.hero-image');

      if (!hero || !heroBg) return;

      let ticking = false;

      const updateParallax = () => {
        const scrollY = window.scrollY || window.pageYOffset;
        const heroHeight = hero.offsetHeight;

        if (scrollY <= heroHeight) {
          // Move background subtly slower than foreground scroll
          const translateVal = scrollY * 0.38;
          heroBg.style.transform = `translate3d(0, ${translateVal}px, 0)`;
        }
        ticking = false;
      };

      window.addEventListener('scroll', () => {
        if (!ticking) {
          window.requestAnimationFrame(updateParallax);
          ticking = true;
        }
      }, { passive: true });
    },

    initTypewriter() {
      const targetEl = Utils.$('.hero-tagline') ||
                       Utils.$('#hero-tagline') ||
                       Utils.$('.tagline-typewriter') ||
                       Utils.$('[data-typewriter]');

      if (!targetEl) return;

      // Tagline text with five pillars
      const tagline = 'Learn • Build • Compete • Lead • Serve';
      const words = ['Learn', '•', 'Build', '•', 'Compete', '•', 'Lead', '•', 'Serve'];

      // Clear existing content and create cursor
      targetEl.textContent = '';
      const textSpan = document.createElement('span');
      textSpan.className = 'typewriter-content';

      const cursorSpan = document.createElement('span');
      cursorSpan.className = 'typewriter-cursor';
      cursorSpan.textContent = '|';
      cursorSpan.setAttribute('aria-hidden', 'true');

      // Inline styles for cursor blink
      cursorSpan.style.display = 'inline-block';
      cursorSpan.style.marginLeft = '4px';
      cursorSpan.style.opacity = '1';
      cursorSpan.style.animation = 'svwsBlink 0.9s infinite';

      targetEl.appendChild(textSpan);
      targetEl.appendChild(cursorSpan);

      // Inject cursor keyframes if not present
      if (!Utils.$('#svws-cursor-style')) {
        const style = document.createElement('style');
        style.id = 'svws-cursor-style';
        style.textContent = `
          @keyframes svwsBlink {
            0%, 49% { opacity: 1; }
            50%, 100% { opacity: 0; }
          }
        `;
        document.head.appendChild(style);
      }

      let charIndex = 0;

      const typeChar = () => {
        if (charIndex < tagline.length) {
          textSpan.textContent += tagline.charAt(charIndex);
          const currentChar = tagline.charAt(charIndex);
          charIndex++;

          // Natural cadence: pause longer on bullet point
          let nextDelay = SVWS_CONFIG.typewriterSpeed;
          if (currentChar === '•') {
            nextDelay = SVWS_CONFIG.typewriterWordPause;
          } else if (currentChar === ' ') {
            nextDelay = 60;
          } else {
            nextDelay = SVWS_CONFIG.typewriterSpeed + (Math.random() * 40 - 20);
          }

          setTimeout(typeChar, nextDelay);
        } else {
          // Finished typing: highlight effect
          textSpan.classList.add('typewriter-complete');
          setTimeout(() => {
            // Keep cursor pulsing peacefully
            cursorSpan.style.color = '#e29578';
          }, 500);
        }
      };

      // Trigger typewriter when hero section is visible
      SVWSObserver.create(targetEl, () => {
        setTimeout(typeChar, 400);
      }, { threshold: 0.1 });
    }
  };

  /**
   * ============================================================================
   * 6. SANSKRIT SHLOKA SACRED TYPOGRAPHY REVEAL
   * Inspiring reveal for the school motto & philosophy section
   * "सा विद्या या विमुक्तये" / "विद्ययाऽमृतमश्नुते"
   * ============================================================================
   */
  const ShlokaReveal = {
    init() {
      const shlokaElements = Utils.$$('.sanskrit-shloka, .philosophy-shloka, [data-shloka]');
      if (!shlokaElements.length) return;

      shlokaElements.forEach(el => {
        const originalText = el.getAttribute('data-shloka-text') || el.innerText.trim();
        const meaningEl = el.nextElementSibling && el.nextElementSibling.classList.contains('shloka-meaning')
          ? el.nextElementSibling
          : Utils.$('.shloka-meaning', el.parentElement);

        SVWSObserver.create(el, () => {
          el.style.opacity = '1';
          el.classList.add('shloka-revealing');

          // Word-by-word graceful shimmer fade-in
          const words = originalText.split(' ');
          el.innerHTML = words.map((w, i) => {
            return `<span class="shloka-word" style="display:inline-block; opacity:0; transform:translateY(12px); transition:all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${i * 120}ms;">${Utils.escapeHTML(w)}&nbsp;</span>`;
          }).join('');

          // Trigger word transforms
          requestAnimationFrame(() => {
            const spans = Utils.$$('.shloka-word', el);
            spans.forEach(span => {
              span.style.opacity = '1';
              span.style.transform = 'translateY(0)';
            });
          });

          // Reveal English / Marathi meaning after shloka finishes
          if (meaningEl) {
            setTimeout(() => {
              meaningEl.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
              meaningEl.style.opacity = '1';
              meaningEl.style.transform = 'translateY(0)';
              meaningEl.classList.add('active');
            }, words.length * 120 + 300);
          }
        }, { threshold: 0.25 });
      });
    }
  };

  /**
   * ============================================================================
   * 7. COUNTER METRIC ANIMATION CONTROLLER
   * Animates statistics from 0 to target value on scroll view
   * Supports prefixes, suffixes (+, %, Acres) and comma formatting
   * ============================================================================
   */
  const CounterAnimation = {
    init() {
      const counters = Utils.$$('.counter-number, .counter, [data-target]');
      if (!counters.length) return;

      SVWSObserver.create(counters, (counter) => {
        this.animateCounter(counter);
      }, { threshold: 0.2 });
    },

    animateCounter(el) {
      // Extract target value
      const rawTarget = el.getAttribute('data-target') || el.innerText.trim();
      const cleanedNum = parseFloat(rawTarget.replace(/[^0-9.]/g, '')) || 0;
      const suffix = el.getAttribute('data-suffix') || rawTarget.replace(/[0-9.,]/g, '') || '';
      const prefix = el.getAttribute('data-prefix') || '';
      const isInteger = Number.isInteger(cleanedNum);

      let startTime = null;
      const duration = SVWS_CONFIG.counterDuration;

      const step = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = Utils.easeOutExpo(progress);
        const currentVal = easedProgress * cleanedNum;

        // Number formatting with comma separators
        let formattedVal;
        if (isInteger) {
          formattedVal = Math.floor(currentVal).toLocaleString('en-IN');
        } else {
          formattedVal = currentVal.toFixed(1);
        }

        el.textContent = `${prefix}${formattedVal}${suffix}`;

        if (progress < 1) {
          window.requestAnimationFrame(step);
        } else {
          // Final exact value guarantee
          const finalFormatted = isInteger
            ? cleanedNum.toLocaleString('en-IN')
            : cleanedNum.toString();
          el.textContent = `${prefix}${finalFormatted}${suffix}`;
          el.classList.add('counter-completed');
        }
      };

      window.requestAnimationFrame(step);
    }
  };

  /**
   * ============================================================================
   * 8. SCROLL REVEAL ANIMATIONS CONTROLLER
   * Adds `.active` class to `.reveal`, `.reveal-left`, `.reveal-right`, `.reveal-up`
   * Incorporates staggered delays via `data-delay` attribute
   * ============================================================================
   */
  const ScrollReveal = {
    init() {
      const revealItems = Utils.$$('.reveal, .reveal-left, .reveal-right, .reveal-up, .reveal-down, .reveal-zoom');
      if (!revealItems.length) return;

      SVWSObserver.create(revealItems, (item) => {
        const delay = parseInt(item.getAttribute('data-delay'), 10) || 0;

        if (delay > 0) {
          item.style.transitionDelay = `${delay}ms`;
        }

        item.classList.add('active');
        item.classList.add('revealed');
      }, {
        rootMargin: '0px 0px -40px 0px',
        threshold: 0.12
      });

      // Auto-stagger for grid children inside containers marked data-stagger
      const staggeredContainers = Utils.$$('[data-stagger]');
      staggeredContainers.forEach(container => {
        const step = parseInt(container.getAttribute('data-stagger'), 10) || 120;
        const children = Utils.$$('.reveal, .reveal-up, .reveal-left, .reveal-right', container);
        children.forEach((child, idx) => {
          if (!child.getAttribute('data-delay')) {
            child.setAttribute('data-delay', String(idx * step));
          }
        });
      });
    }
  };

  /**
   * ============================================================================
   * 9. TABS COMPONENT CONTROLLER
   * Accessible Academics Tab switcher (Std 1–5, 6–8, 9–10, 11–12 JEE/NEET)
   * ============================================================================
   */
  const Tabs = {
    init() {
      const tabContainers = Utils.$$('.tabs-container, .academics-tabs, [data-tabs]');

      // If containers not explicitly defined, search for tab button clusters
      if (!tabContainers.length) {
        const orphanButtons = Utils.$$('.tab-btn, [data-tab]');
        if (orphanButtons.length) {
          this.bindTabGroup(document);
        }
        return;
      }

      tabContainers.forEach(container => this.bindTabGroup(container));
    },

    bindTabGroup(container) {
      const tabButtons = Utils.$$('.tab-btn, [data-tab]', container);
      const tabPanels = Utils.$$('.tab-panel, [data-panel]', container.parentElement || container);

      if (!tabButtons.length) return;

      const switchTab = (targetBtn) => {
        const targetKey = targetBtn.getAttribute('data-tab');

        // Update Buttons
        tabButtons.forEach(btn => {
          const isActive = btn === targetBtn;
          btn.classList.toggle('active', isActive);
          btn.setAttribute('aria-selected', String(isActive));
          btn.setAttribute('tabindex', isActive ? '0' : '-1');
        });

        // Update Panels
        tabPanels.forEach(panel => {
          const panelKey = panel.getAttribute('data-panel') || panel.getAttribute('id');
          const isMatch = panelKey === targetKey;

          if (isMatch) {
            panel.classList.add('active');
            panel.style.display = 'block';
            panel.removeAttribute('hidden');
            panel.setAttribute('aria-hidden', 'false');

            // Trigger any reveal children inside this panel
            const nestedReveals = Utils.$$('.reveal, .reveal-up', panel);
            nestedReveals.forEach(r => r.classList.add('active'));
          } else {
            panel.classList.remove('active');
            panel.style.display = 'none';
            panel.setAttribute('hidden', '');
            panel.setAttribute('aria-hidden', 'true');
          }
        });
      };

      tabButtons.forEach((btn, index) => {
        // Accessibility initialization
        btn.setAttribute('role', 'tab');
        btn.setAttribute('aria-selected', btn.classList.contains('active') ? 'true' : 'false');
        btn.setAttribute('tabindex', btn.classList.contains('active') ? '0' : '-1');

        btn.addEventListener('click', (e) => {
          e.preventDefault();
          switchTab(btn);
        });

        // Keyboard navigation (Arrow keys)
        btn.addEventListener('keydown', (e) => {
          let nextIndex = null;
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            nextIndex = (index + 1) % tabButtons.length;
          } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            nextIndex = (index - 1 + tabButtons.length) % tabButtons.length;
          }

          if (nextIndex !== null) {
            e.preventDefault();
            tabButtons[nextIndex].focus();
            switchTab(tabButtons[nextIndex]);
          }
        });
      });

      // Activate first or currently active tab initially
      const activeBtn = tabButtons.find(b => b.classList.contains('active')) || tabButtons[0];
      if (activeBtn) switchTab(activeBtn);
    }
  };

  /**
   * ============================================================================
   * 10. IMAGE GALLERY & CAROUSEL COMPONENT
   * Auto-sliding carousel with next/prev, indicators, pause on hover, & swipe
   * ============================================================================
   */
  const Carousel = {
    init() {
      const carousels = Utils.$$('.carousel, .gallery-carousel, [data-carousel]');
      carousels.forEach(carousel => this.setupCarousel(carousel));
    },

    setupCarousel(carousel) {
      const track = Utils.$('.carousel-track', carousel) || Utils.$('.carousel-inner', carousel) || carousel;
      const slides = Utils.$$('.carousel-slide, .carousel-item', carousel);
      const prevBtn = Utils.$('.carousel-prev, [data-carousel-prev]', carousel);
      const nextBtn = Utils.$('.carousel-next, [data-carousel-next]', carousel);
      const dotsContainer = Utils.$('.carousel-dots, .carousel-indicators', carousel);

      if (!slides.length) return;

      let currentIndex = slides.findIndex(s => s.classList.contains('active'));
      if (currentIndex === -1) currentIndex = 0;

      let autoplayTimer = null;
      let isPaused = false;

      // Create dots dynamically if container exists and is empty
      if (dotsContainer && !dotsContainer.children.length) {
        slides.forEach((_, idx) => {
          const dot = document.createElement('button');
          dot.className = `carousel-dot ${idx === currentIndex ? 'active' : ''}`;
          dot.setAttribute('type', 'button');
          dot.setAttribute('aria-label', `Go to slide ${idx + 1}`);
          dot.setAttribute('data-slide-to', String(idx));
          dotsContainer.appendChild(dot);
        });
      }

      const dots = dotsContainer ? Utils.$$('.carousel-dot, [data-slide-to]', dotsContainer) : [];

      const goToSlide = (newIndex) => {
        if (newIndex < 0) {
          currentIndex = slides.length - 1;
        } else if (newIndex >= slides.length) {
          currentIndex = 0;
        } else {
          currentIndex = newIndex;
        }

        slides.forEach((slide, idx) => {
          const isActive = idx === currentIndex;
          slide.classList.toggle('active', isActive);
          slide.setAttribute('aria-hidden', String(!isActive));
        });

        dots.forEach((dot, idx) => {
          dot.classList.toggle('active', idx === currentIndex);
          dot.setAttribute('aria-current', idx === currentIndex ? 'true' : 'false');
        });
      };

      const nextSlide = () => goToSlide(currentIndex + 1);
      const prevSlide = () => goToSlide(currentIndex - 1);

      // Bind button events
      if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
          e.preventDefault();
          nextSlide();
          resetAutoplay();
        });
      }

      if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
          e.preventDefault();
          prevSlide();
          resetAutoplay();
        });
      }

      // Bind dot events (event delegation)
      if (dotsContainer) {
        dotsContainer.addEventListener('click', (e) => {
          const dot = e.target.closest('[data-slide-to], .carousel-dot');
          if (!dot) return;
          const targetIndex = parseInt(dot.getAttribute('data-slide-to'), 10);
          if (!isNaN(targetIndex)) {
            goToSlide(targetIndex);
            resetAutoplay();
          }
        });
      }

      // Autoplay management
      const startAutoplay = () => {
        if (autoplayTimer) clearInterval(autoplayTimer);
        autoplayTimer = setInterval(() => {
          if (!isPaused) nextSlide();
        }, SVWS_CONFIG.carouselAutoplayInterval);
      };

      const stopAutoplay = () => {
        if (autoplayTimer) {
          clearInterval(autoplayTimer);
          autoplayTimer = null;
        }
      };

      const resetAutoplay = () => {
        stopAutoplay();
        startAutoplay();
      };

      // Pause on hover
      carousel.addEventListener('mouseenter', () => { isPaused = true; });
      carousel.addEventListener('mouseleave', () => { isPaused = false; });
      carousel.addEventListener('focusin', () => { isPaused = true; });
      carousel.addEventListener('focusout', () => { isPaused = false; });

      // Mobile Touch / Swipe Handling
      let touchStartX = 0;
      let touchStartY = 0;
      let touchEndX = 0;

      carousel.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
        }
      }, { passive: true });

      carousel.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1) {
          touchEndX = e.touches[0].clientX;
        }
      }, { passive: true });

      carousel.addEventListener('touchend', (e) => {
        const deltaX = touchEndX - touchStartX;
        const deltaY = Math.abs((e.changedTouches[0] ? e.changedTouches[0].clientY : 0) - touchStartY);

        // Require at least 45px horizontal movement, and more horizontal than vertical
        if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > deltaY) {
          if (deltaX < 0) {
            nextSlide();
          } else {
            prevSlide();
          }
          resetAutoplay();
        }
        touchStartX = 0;
        touchEndX = 0;
      }, { passive: true });

      // Initial slide state & start
      goToSlide(currentIndex);
      startAutoplay();
    }
  };

  /**
   * ============================================================================
   * 11. ADMISSION ENQUIRY FORM VALIDATION & FLOATING LABELS
   * Rigorous client-side validation, Indian phone format checks, floating labels,
   * inline error messages, and elegant asynchronous thank you confirmation
   * ============================================================================
   */
  const AdmissionForm = {
    init() {
      const forms = Utils.$$('.admission-form, #admission-form, #enquiry-form, form[name="admission"]');
      forms.forEach(form => this.setupForm(form));
      this.setupFloatingLabels();
    },

    setupFloatingLabels() {
      const inputs = Utils.$$('.form-control, .form-input, .input-field');

      const checkValue = (input) => {
        const group = input.closest('.form-group, .input-group') || input.parentElement;
        const hasContent = Boolean(input.value && input.value.trim().length > 0);
        if (group) {
          group.classList.toggle('has-value', hasContent);
        }
        input.classList.toggle('has-value', hasContent);
      };

      inputs.forEach(input => {
        const group = input.closest('.form-group, .input-group') || input.parentElement;

        input.addEventListener('focus', () => {
          if (group) group.classList.add('focused');
          input.classList.add('focused');
        });

        input.addEventListener('blur', () => {
          if (group) group.classList.remove('focused');
          input.classList.remove('focused');
          checkValue(input);
        });

        input.addEventListener('input', () => checkValue(input));
        input.addEventListener('change', () => checkValue(input));

        // Initial check for browser autofill or default values
        checkValue(input);
      });
    },

    setupForm(form) {
      const nameInput = Utils.$('input[name="name"], input[name="student_name"], #student-name, #name', form);
      const phoneInput = Utils.$('input[name="phone"], input[name="mobile"], #student-phone, #phone', form);
      const classSelect = Utils.$('select[name="class"], select[name="grade"], #student-class, #class', form);
      const emailInput = Utils.$('input[name="email"], #email', form);
      const submitBtn = Utils.$('button[type="submit"], input[type="submit"]', form);

      // Clean phone input: allow only digits and limit to 10
      if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
          let val = e.target.value.replace(/[^0-9]/g, '');
          if (val.length > 10) val = val.slice(0, 10);
          e.target.value = val;
          this.clearError(phoneInput);
        });
      }

      // Clear field errors on input
      [nameInput, classSelect, emailInput].forEach(field => {
        if (field) {
          field.addEventListener('input', () => this.clearError(field));
          field.addEventListener('change', () => this.clearError(field));
        }
      });

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        let isValid = true;

        // 1. Validate Name (at least 2 letters, letters and spaces only)
        if (nameInput) {
          const val = nameInput.value.trim();
          if (!val || val.length < 2) {
            this.showError(nameInput, 'Please enter the student or parent name (minimum 2 characters).');
            isValid = false;
          } else if (!/^[a-zA-Z\s.'’]+$/.test(val)) {
            this.showError(nameInput, 'Name should contain valid alphabetic characters only.');
            isValid = false;
          } else {
            this.clearError(nameInput);
          }
        }

        // 2. Validate Phone (Indian 10-digit mobile starting with 6, 7, 8, 9)
        if (phoneInput) {
          const val = phoneInput.value.trim().replace(/[\s-]/g, '');
          const indianPhoneRegex = /^[6-9]\d{9}$/;
          if (!val) {
            this.showError(phoneInput, 'Mobile number is required for admissions communication.');
            isValid = false;
          } else if (!indianPhoneRegex.test(val)) {
            this.showError(phoneInput, 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).');
            isValid = false;
          } else {
            this.clearError(phoneInput);
          }
        }

        // 3. Validate Class Selection
        if (classSelect) {
          const val = classSelect.value.trim();
          if (!val || val === '' || val.toLowerCase().includes('select')) {
            this.showError(classSelect, 'Please select the prospective grade/class (Std. 1 to Std. 12).');
            isValid = false;
          } else {
            this.clearError(classSelect);
          }
        }

        // 4. Validate Email (Optional, but if filled, must be valid)
        if (emailInput && emailInput.value.trim()) {
          const val = emailInput.value.trim();
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(val)) {
            this.showError(emailInput, 'Please enter a valid email address.');
            isValid = false;
          } else {
            this.clearError(emailInput);
          }
        }

        if (!isValid) {
          // Focus first invalid input with a gentle scroll
          const firstError = Utils.$('.is-invalid', form);
          if (firstError) {
            firstError.focus();
          }
          return;
        }

        // Form is valid: Process submission simulation
        this.handleSuccessfulSubmit(form, submitBtn);
      });
    },

    showError(input, message) {
      input.classList.add('is-invalid');
      input.setAttribute('aria-invalid', 'true');

      let errorEl = input.parentElement.querySelector('.field-error, .invalid-feedback');
      if (!errorEl) {
        errorEl = document.createElement('div');
        errorEl.className = 'field-error invalid-feedback';
        errorEl.style.color = '#c1121f';
        errorEl.style.fontSize = '0.85rem';
        errorEl.style.marginTop = '4px';
        errorEl.style.fontWeight = '500';
        input.parentElement.appendChild(errorEl);
      }
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    },

    clearError(input) {
      input.classList.remove('is-invalid');
      input.removeAttribute('aria-invalid');
      const errorEl = input.parentElement.querySelector('.field-error, .invalid-feedback');
      if (errorEl) {
        errorEl.style.display = 'none';
        errorEl.textContent = '';
      }
    },

    handleSuccessfulSubmit(form, submitBtn) {
      const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Submit';

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
          <span class="spinner" style="display:inline-block; width:16px; height:16px; border:2px solid #ffffff; border-top-color:transparent; border-radius:50%; animation:svwsSpin 0.7s linear infinite; margin-right:8px; vertical-align:middle;"></span>
          Registering Enquiry...
        `;
      }

      // Inject spinner animation if not present
      if (!Utils.$('#svws-spin-style')) {
        const style = document.createElement('style');
        style.id = 'svws-spin-style';
        style.textContent = `
          @keyframes svwsSpin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `;
        document.head.appendChild(style);
      }

      // Simulate responsive server network delay
      setTimeout(() => {
        // Generate random enquiry reference ID
        const enquiryId = 'SVWS-' + Math.floor(100000 + Math.random() * 900000);

        // Replace or augment form with success card
        const successMessageHTML = `
          <div class="form-success-card reveal-up active" style="text-align:center; padding:32px 24px; background:#f0f9f5; border:2px solid #2d6a4f; border-radius:12px; margin-top:16px;">
            <div style="width:64px; height:64px; line-height:64px; border-radius:50%; background:#2d6a4f; color:#ffffff; font-size:32px; margin:0 auto 16px;">✓</div>
            <h3 style="color:#1b4332; margin-bottom:8px; font-size:1.4rem;">धन्यवाद! Enquiry Registered Successfully</h3>
            <p style="color:#2d6a4f; font-weight:600; margin-bottom:12px;">Enquiry Reference: <span style="letter-spacing:1px; background:#d8f3dc; padding:2px 8px; border-radius:4px;">${enquiryId}</span></p>
            <p style="color:#333333; font-size:0.95rem; line-height:1.6; max-width:440px; margin:0 auto 20px;">
              Thank you for choosing <strong>Saraswati Vishwa Wisdom School</strong>. Our admissions counselor will contact you within 24 hours to schedule your campus visit and student assessment.
            </p>
            <button type="button" class="btn btn-secondary reset-enquiry-btn" style="cursor:pointer; padding:8px 20px; font-size:0.9rem; border-radius:6px; background:#1b4332; color:#fff; border:none;">
              Submit Another Enquiry
            </button>
          </div>
        `;

        form.style.display = 'none';
        const wrapper = document.createElement('div');
        wrapper.className = 'form-success-wrapper';
        wrapper.innerHTML = successMessageHTML;
        form.parentElement.appendChild(wrapper);

        // Bind reset button
        const resetBtn = Utils.$('.reset-enquiry-btn', wrapper);
        if (resetBtn) {
          resetBtn.addEventListener('click', () => {
            wrapper.remove();
            form.reset();
            form.style.display = 'block';
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.innerHTML = originalBtnText;
            }
          });
        }
      }, 750);
    }
  };

  /**
   * ============================================================================
   * 12. MODAL & POPUP CONTROLLER
   * Automatic 15-second enquiry popup, CTA button triggers, ESC & overlay dismiss
   * Remembers dismissal across session
   * ============================================================================
   */
  const ModalController = {
    init() {
      this.modal = Utils.$('#enquiry-modal') || Utils.$('.modal') || Utils.$('[data-modal="enquiry"]');
      if (!this.modal) return;

      this.overlay = Utils.$('.modal-overlay') || Utils.$('.modal-backdrop') || this.modal;
      this.closeButtons = Utils.$$('.modal-close, [data-close-modal], .close-modal', this.modal);
      this.openButtons = Utils.$$('[data-open-modal], .open-enquiry-modal, a[href="#enquiry-modal"], a[href="#admission-enquiry-modal"]');

      this.bindTriggers();
      this.bindCloseHandlers();
      this.bindAutoPopup();
    },

    openModal() {
      if (!this.modal) return;

      this.modal.classList.add('active', 'modal-open', 'show');
      this.modal.style.display = 'flex';
      this.modal.removeAttribute('hidden');
      this.modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-active', 'no-scroll');

      // Autofocus first interactive element in modal
      const firstInput = Utils.$('input, select, button', this.modal);
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 150);
      }
    },

    closeModal() {
      if (!this.modal) return;

      this.modal.classList.remove('active', 'modal-open', 'show');
      this.modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-active', 'no-scroll');

      setTimeout(() => {
        if (!this.modal.classList.contains('active')) {
          this.modal.style.display = 'none';
        }
      }, 300);

      // Record dismissal in sessionStorage so it doesn't auto-popup repeatedly
      try {
        sessionStorage.setItem(SVWS_CONFIG.storageKeys.modalDismissed, 'true');
      } catch (e) {}
    },

    bindTriggers() {
      this.openButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          this.openModal();
        });
      });
    },

    bindCloseHandlers() {
      this.closeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          this.closeModal();
        });
      });

      // Overlay click dismiss (clicking outside modal dialog box)
      this.modal.addEventListener('click', (e) => {
        const dialog = Utils.$('.modal-dialog, .modal-content, .modal-box', this.modal);
        if (dialog && !dialog.contains(e.target) && e.target === this.modal) {
          this.closeModal();
        } else if (e.target.classList.contains('modal-overlay')) {
          this.closeModal();
        }
      });

      // Escape key listener
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.modal.classList.contains('active')) {
          this.closeModal();
        }
      });
    },

    bindAutoPopup() {
      // Check if modal was already dismissed this session
      try {
        if (sessionStorage.getItem(SVWS_CONFIG.storageKeys.modalDismissed) === 'true') {
          return;
        }
      } catch (e) {
        return;
      }

      // Trigger automatic modal after 15 seconds of browsing
      setTimeout(() => {
        // Don't interrupt if user is actively filling another form
        const activeEl = document.activeElement;
        const isUserTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');

        if (!isUserTyping && !this.modal.classList.contains('active')) {
          this.openModal();
        }
      }, SVWS_CONFIG.autoModalDelay);
    }
  };

  /**
   * ============================================================================
   * 13. BACK TO TOP BUTTON CONTROLLER
   * Shows after scrolling 500px, smooth scroll to top with accessible focus
   * ============================================================================
   */
  const BackToTop = {
    init() {
      let btn = Utils.$('#back-to-top') || Utils.$('.back-to-top') || Utils.$('[data-back-to-top]');

      // If button doesn't exist in markup, inject accessible button dynamically
      if (!btn) {
        btn = document.createElement('button');
        btn.id = 'back-to-top';
        btn.className = 'back-to-top';
        btn.setAttribute('type', 'button');
        btn.setAttribute('aria-label', 'Back to top of page');
        btn.innerHTML = '&#8593;'; // Up arrow
        document.body.appendChild(btn);
      }

      const toggleVisibility = () => {
        const scrolled = window.scrollY || window.pageYOffset;
        if (scrolled > SVWS_CONFIG.backToTopThreshold) {
          btn.classList.add('visible', 'show');
          btn.style.opacity = '1';
          btn.style.visibility = 'visible';
          btn.removeAttribute('hidden');
        } else {
          btn.classList.remove('visible', 'show');
          btn.style.opacity = '0';
          btn.style.visibility = 'hidden';
          btn.setAttribute('hidden', '');
        }
      };

      window.addEventListener('scroll', Utils.throttle(toggleVisibility, 50), { passive: true });
      toggleVisibility();

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });

        // Accessible focus reset to top
        const header = Utils.$('header, nav, h1');
        if (header) {
          header.setAttribute('tabindex', '-1');
          header.focus({ preventScroll: true });
        }
      });
    }
  };

  /**
   * ============================================================================
   * 14. SECTION PARALLAX & VISUAL ENHANCEMENT CONTROLLER
   * Subtle parallax depth on background textures, badges, and decorative shapes
   * ============================================================================
   */
  const SectionParallax = {
    init() {
      const parallaxSections = Utils.$$('.section-parallax, .parallax-bg, [data-parallax]');
      if (!parallaxSections.length) return;

      let ticking = false;

      const updateParallax = () => {
        const scrollY = window.scrollY || window.pageYOffset;
        const viewportHeight = window.innerHeight;

        parallaxSections.forEach(el => {
          const rect = el.getBoundingClientRect();
          // Process only when element is in or near viewport
          if (rect.top < viewportHeight && rect.bottom > 0) {
            const speed = parseFloat(el.getAttribute('data-parallax-speed')) || 0.15;
            const yOffset = (rect.top - viewportHeight / 2) * speed;
            el.style.backgroundPositionY = `calc(50% + ${yOffset}px)`;
          }
        });

        ticking = false;
      };

      window.addEventListener('scroll', () => {
        if (!ticking) {
          window.requestAnimationFrame(updateParallax);
          ticking = true;
        }
      }, { passive: true });
    }
  };

  /**
   * ============================================================================
   * 15. DYNAMIC FOOTER & SYSTEM INITIALIZER
   * Current copyright year auto-population and global bootstrap orchestrator
   * ============================================================================
   */
  const Footer = {
    init() {
      const yearElements = Utils.$$('.current-year, #current-year, [data-year]');
      const currentYear = new Date().getFullYear();

      yearElements.forEach(el => {
        el.textContent = String(currentYear);
      });
    }
  };

  /**
   * Application Master Orchestrator
   */
  const SVWSApp = {
    init() {
      // 1. Initial preloader initialization
      Preloader.init();

      // 2. Navigation & Sticky Header
      Navigation.init();

      // 3. Urgent Announcements
      AnnouncementBar.init();

      // 4. Hero Visuals & Tagline Typewriter
      HeroSection.init();

      // 5. Sanskrit Shloka Typography
      ShlokaReveal.init();

      // 6. Statistics Counter Animation
      CounterAnimation.init();

      // 7. Scroll Reveals & Staggered Elements
      ScrollReveal.init();

      // 8. Academics Tabs
      Tabs.init();

      // 9. Gallery & Hero Carousel
      Carousel.init();

      // 10. Admission Enquiry Validation
      AdmissionForm.init();

      // 11. Enquiry Modal / Popup
      ModalController.init();

      // 12. Back to Top Floating Action
      BackToTop.init();

      // 13. Section Parallax Enhancements
      SectionParallax.init();

      // 14. Footer Current Year
      Footer.init();

      console.info('%c Saraswati Vishwa Wisdom School ', 'background:#1b4332; color:#d8f3dc; font-size:12px; font-weight:bold; padding:4px 8px; border-radius:4px;', 'Portal scripts initialized successfully.');
    }
  };

  // Safe DOM ready bootstrap
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SVWSApp.init());
  } else {
    SVWSApp.init();
  }

  // Expose API namespace for external debugging or dynamic integrations
  window.SVWS = {
    App: SVWSApp,
    Observer: SVWSObserver,
    Utils: Utils,
    Modal: ModalController
  };

})();
