/**
 * Sets up scroll animations for specified elements using Intersection Observer
 * This utility function can be used in any component that needs scroll animations
 */
export const setupScrollAnimations = (): () => void => {
  // Set up Intersection Observer to detect when elements are in view
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
      }
    });
  }, { threshold: 0.1 });

  // Collect all animated elements and observe them
  const animatedElements = document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right, .scale-in');
  animatedElements.forEach((el) => {
    observer.observe(el);
  });

  // Return cleanup function
  return () => {
    animatedElements.forEach((el) => {
      observer.unobserve(el);
    });
  };
}; 