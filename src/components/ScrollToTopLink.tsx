import React from 'react';
import { Link, LinkProps } from 'react-router-dom';

interface ScrollToTopLinkProps extends LinkProps {
  className?: string;
}

const ScrollToTopLink = ({ children, to, className, ...props }: ScrollToTopLinkProps) => {
  const handleClick = () => {
    window.scrollTo(0, 0);
  };
  
  return (
    <Link 
      to={to} 
      className={className} 
      onClick={handleClick}
      {...props}
    >
      {children}
    </Link>
  );
};

export default ScrollToTopLink; 