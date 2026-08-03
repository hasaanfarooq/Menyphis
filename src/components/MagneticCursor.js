'use client';
import { useEffect, useRef, useState } from 'react';

export default function MagneticCursor() {
  const cursorRef = useRef(null);
  const dotRef = useRef(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isMobile, setIsMobile] = useState(true);
  const trailsRef = useRef([]);
  const posRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) return;

    // Create trail elements
    const trailContainer = document.createElement('div');
    trailContainer.id = 'cursor-trails';
    document.body.appendChild(trailContainer);

    const trailCount = 6;
    const trails = [];
    for (let i = 0; i < trailCount; i++) {
      const trail = document.createElement('div');
      trail.className = 'cursor-trail';
      trail.style.opacity = (1 - i / trailCount) * 0.25;
      trail.style.width = `${8 - i}px`;
      trail.style.height = `${8 - i}px`;
      trailContainer.appendChild(trail);
      trails.push({ el: trail, x: 0, y: 0 });
    }
    trailsRef.current = trails;

    const handleMouseMove = (e) => {
      targetRef.current = { x: e.clientX, y: e.clientY };
      if (dotRef.current) {
        dotRef.current.style.left = `${e.clientX}px`;
        dotRef.current.style.top = `${e.clientY}px`;
      }
    };

    const handleMouseOver = (e) => {
      const target = e.target;
      if (target.closest('a, button, [role="button"], .product-card, input, .filter-btn, .size-btn, .color-btn')) {
        setIsHovering(true);
      }
    };

    const handleMouseOut = (e) => {
      const target = e.target;
      if (target.closest('a, button, [role="button"], .product-card, input, .filter-btn, .size-btn, .color-btn')) {
        setIsHovering(false);
      }
    };

    const animate = () => {
      // Smooth follow for main cursor
      posRef.current.x += (targetRef.current.x - posRef.current.x) * 0.15;
      posRef.current.y += (targetRef.current.y - posRef.current.y) * 0.15;

      if (cursorRef.current) {
        cursorRef.current.style.left = `${posRef.current.x}px`;
        cursorRef.current.style.top = `${posRef.current.y}px`;
      }

      // Trail effect
      let prevX = targetRef.current.x;
      let prevY = targetRef.current.y;
      trailsRef.current.forEach((trail, i) => {
        const speed = 0.08 - i * 0.008;
        trail.x += (prevX - trail.x) * speed;
        trail.y += (prevY - trail.y) * speed;
        trail.el.style.left = `${trail.x}px`;
        trail.el.style.top = `${trail.y}px`;
        prevX = trail.x;
        prevY = trail.y;
      });

      frameRef.current = requestAnimationFrame(animate);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);
    frameRef.current = requestAnimationFrame(animate);

    // Hide default cursor
    document.body.style.cursor = 'none';
    const style = document.createElement('style');
    style.id = 'cursor-hide';
    style.textContent = 'a, button, input, [role="button"] { cursor: none !important; }';
    document.head.appendChild(style);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      cancelAnimationFrame(frameRef.current);
      document.body.style.cursor = '';
      document.getElementById('cursor-hide')?.remove();
      document.getElementById('cursor-trails')?.remove();
    };
  }, [isMobile]);

  if (isMobile) return null;

  return (
    <>
      <div
        ref={cursorRef}
        className={`custom-cursor ${isHovering ? 'hovering' : ''}`}
      />
      <div ref={dotRef} className="cursor-dot" />
    </>
  );
}
