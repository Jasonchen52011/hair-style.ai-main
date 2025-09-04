"use client"

import Image from 'next/image';
import { useState, useEffect, useRef, memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ButtonSignin from "./ButtonSignin";

// 优化的导航链接组件
const NavLink = memo(({ href, children, isActive }: { href: string; children: React.ReactNode; isActive: boolean }) => (
  <Link 
    href={href}
    className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
      isActive ? 'text-purple-700 bg-white' : 'text-gray-700 hover:text-purple-700 hover:bg-purple-50'
    }`}
  >
    {children}
  </Link>
));

NavLink.displayName = 'NavLink';

// 优化的下拉菜单组件
const DropdownMenu = memo(({ isOpen, onClose, children }: { 
  isOpen: boolean; 
  onClose: () => void; 
  children: React.ReactNode; 
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
      <div className="py-2">
        {children}
      </div>
    </div>
  );
});

DropdownMenu.displayName = 'DropdownMenu';

// 优化的下拉菜单项组件
const DropdownItem = memo(({ href, children, onClick }: { 
  href: string; 
  children: React.ReactNode; 
  onClick: () => void; 
}) => (
  <Link
    href={href}
    className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors duration-200"
    onClick={onClick}
  >
    {children}
  </Link>
));

DropdownItem.displayName = 'DropdownItem';

// 优化的下拉按钮组件
const DropdownButton = memo(({ isOpen, onClick, children }: { 
  isOpen: boolean; 
  onClick: () => void; 
  children: React.ReactNode; 
}) => (
  <button 
    onClick={onClick}
    className="flex items-center px-4 py-2 rounded-lg text-gray-700 hover:text-purple-700 hover:bg-purple-50 transition-colors duration-200"
  >
    {children}
    <svg 
      className={`ml-1 w-4 h-4 transition-transform duration-200 ${
        isOpen ? 'rotate-180' : ''
      }`} 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  </button>
));

DropdownButton.displayName = 'DropdownButton';

// 优化的Logo组件
const Logo = memo(() => (
  <Link href="/" className="flex items-center group">
    <Image
      src="/images/logo/logo.png"
      alt="Hairstyle.ai Logo"
      width={32}
      height={32}
      className="mr-2"
      priority
    />
    <span className="text-2xl font-semibold group-hover:text-purple-700 transition-colors duration-200" aria-label="Hair-style.ai">
      Hairstyle AI
    </span>
  </Link>
));

Logo.displayName = 'Logo';

export default function Navbar() {
  const [isMounted, setIsMounted] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isHairstyleDropdownOpen, setIsHairstyleDropdownOpen] = useState(false);
  const [isColorDropdownOpen, setIsColorDropdownOpen] = useState(false);
  const [isOtherToolsDropdownOpen, setIsOtherToolsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const hairstyleDropdownRef = useRef<HTMLDivElement>(null);
  const colorDropdownRef = useRef<HTMLDivElement>(null);
  const otherToolsDropdownRef = useRef<HTMLDivElement>(null);

  // 简化的挂载处理
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 优化的外部点击处理 - 包含移动端
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      
      // 桌面端下拉菜单
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsDropdownOpen(false);
      }
      if (hairstyleDropdownRef.current && !hairstyleDropdownRef.current.contains(target)) {
        setIsHairstyleDropdownOpen(false);
      }
      if (colorDropdownRef.current && !colorDropdownRef.current.contains(target)) {
        setIsColorDropdownOpen(false);
      }
      if (otherToolsDropdownRef.current && !otherToolsDropdownRef.current.contains(target)) {
        setIsOtherToolsDropdownOpen(false);
      }
      
      // 移动端下拉菜单 - 如果点击了移动菜单外部，关闭所有下拉菜单
      if (isMobileMenuOpen) {
        const mobileMenu = document.querySelector('[data-mobile-menu]');
        if (mobileMenu && !mobileMenu.contains(target)) {
          setIsHairstyleDropdownOpen(false);
          setIsColorDropdownOpen(false);
          setIsOtherToolsDropdownOpen(false);
          setIsMobileMenuOpen(false);
        }
      }
    };

    if (isDropdownOpen || isHairstyleDropdownOpen || isColorDropdownOpen || isOtherToolsDropdownOpen || isMobileMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isDropdownOpen, isHairstyleDropdownOpen, isColorDropdownOpen, isOtherToolsDropdownOpen, isMobileMenuOpen]);

  // 简化的挂载检查
  if (!isMounted) {
    return (
      <nav className="w-full relative bg-transparent">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center h-16">
              <Logo />
            </div>
            <div className="hidden md:flex items-center space-x-1 ml-auto">
              <div className="flex items-center space-x-2">
                <div className="w-20 h-6 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="w-full sticky top-0 bg-white/95 backdrop-blur-md shadow-md z-50 transition-all duration-300">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center h-16">
            <Logo />
          </div>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center space-x-1 ml-auto">
            <NavLink href="/" isActive={pathname === '/'}>
              Home
            </NavLink>
            
            {/* Hairstyle Filter Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <DropdownButton 
                isOpen={isDropdownOpen}
                onClick={() => {
                  setIsDropdownOpen(!isDropdownOpen);
                  setIsColorDropdownOpen(false);
                }}
              >
                Hairstyle Filter
              </DropdownButton>
              
              <DropdownMenu isOpen={isDropdownOpen} onClose={() => setIsDropdownOpen(false)}>
                <DropdownItem href="/hairstyles-for-girls" onClick={() => setIsDropdownOpen(false)}>
                  Girl Hairstyle Filter
                </DropdownItem>
                <DropdownItem href="/ai-hairstyle-male" onClick={() => setIsDropdownOpen(false)}>
                  Male Hairstyle Filter
                </DropdownItem>
                <DropdownItem href="/ai-hairstyle-online-free-female" onClick={() => setIsDropdownOpen(false)}>
                  Female Hairstyle Filter
                </DropdownItem>
                <DropdownItem href="/buzz-cut-filter" onClick={() => setIsDropdownOpen(false)}>
                  Buzz Cut Filter
                </DropdownItem>
                <DropdownItem href="/bob-haircut-filter" onClick={() => setIsDropdownOpen(false)}>
                  Bob Haircut Filter
                </DropdownItem>
                <DropdownItem href="/bangs-filter" onClick={() => setIsDropdownOpen(false)}>
                  Bangs Filter
                </DropdownItem>
                <DropdownItem href="/ai-braids-filter" onClick={() => setIsDropdownOpen(false)}>
                  Braids Filter
                </DropdownItem>
                <DropdownItem href="/perm-filter" onClick={() => setIsDropdownOpen(false)}>
                  Perm Filter
                </DropdownItem>
                <DropdownItem href="/pixie-cut-filter" onClick={() => setIsDropdownOpen(false)}>
                  Pixie Cut Filter
                </DropdownItem>
                <DropdownItem href="/short-hair-filter" onClick={() => setIsDropdownOpen(false)}>
                  Short Hair Filter
                </DropdownItem>
                <DropdownItem href="/long-hair-filter" onClick={() => setIsDropdownOpen(false)}>
                  Long Hair Filter
                </DropdownItem>
                <DropdownItem href="/man-bun-filter" onClick={() => setIsDropdownOpen(false)}>
                  Man Bun Filter
                </DropdownItem>
                <DropdownItem href="/undercut-filter" onClick={() => setIsDropdownOpen(false)}>
                  Undercut Filter
                </DropdownItem>
                <DropdownItem href="/pompadour-filter" onClick={() => setIsDropdownOpen(false)}>
                  Pompadour Filter
                </DropdownItem>
                <DropdownItem href="/textured-fringe-filter" onClick={() => setIsDropdownOpen(false)}>
                  Textured Fringe Filter
                </DropdownItem>
                <DropdownItem href="/low-fade-haircut-filter" onClick={() => setIsDropdownOpen(false)}>
                  Low Fade Filter
                </DropdownItem>
                <DropdownItem href="/dreadlocks-filter" onClick={() => setIsDropdownOpen(false)}>
                  Dreadlocks Filter
                </DropdownItem>
              </DropdownMenu>
            </div>

            {/* Hair Color Dropdown */}
            <div className="relative" ref={colorDropdownRef}>
              <DropdownButton 
                isOpen={isColorDropdownOpen}
                onClick={() => {
                  setIsColorDropdownOpen(!isColorDropdownOpen);
                  setIsDropdownOpen(false);
                }}
              >
                Hair Color
              </DropdownButton>
              
              <DropdownMenu isOpen={isColorDropdownOpen} onClose={() => setIsColorDropdownOpen(false)}>
                <DropdownItem href="/black-hair-filter" onClick={() => setIsColorDropdownOpen(false)}>
                  Black Hair Filter
                </DropdownItem>
                <DropdownItem href="/blonde-hair-filter" onClick={() => setIsColorDropdownOpen(false)}>
                  Blonde Hair Filter
                </DropdownItem>
                <DropdownItem href="/red-hair-filter" onClick={() => setIsColorDropdownOpen(false)}>
                  Red Hair Filter
                </DropdownItem>
                <DropdownItem href="/white-hair-filter" onClick={() => setIsColorDropdownOpen(false)}>
                  White Hair Filter
                </DropdownItem>
                <DropdownItem href="/gray-hair-filter" onClick={() => setIsColorDropdownOpen(false)}>
                  Gray Hair Filter
                </DropdownItem>
                <DropdownItem href="/pink-hair-filter" onClick={() => setIsColorDropdownOpen(false)}>
                  Pink Hair Filter
                </DropdownItem>
                <DropdownItem href="/ai-hair-color-changer" onClick={() => setIsColorDropdownOpen(false)}>
                  AI Hair Color Changer
                </DropdownItem>
              </DropdownMenu>
            </div>

            {/* Other Tools Dropdown */}
            <div className="relative" ref={otherToolsDropdownRef}>
              <DropdownButton 
                isOpen={isOtherToolsDropdownOpen}
                onClick={() => {
                  setIsOtherToolsDropdownOpen(!isOtherToolsDropdownOpen);
                  setIsDropdownOpen(false);
                  setIsColorDropdownOpen(false);
                }}
              >
                Other Tools
              </DropdownButton>
              
              <DropdownMenu isOpen={isOtherToolsDropdownOpen} onClose={() => setIsOtherToolsDropdownOpen(false)}>
                <DropdownItem href="/face-shape-detector" onClick={() => setIsOtherToolsDropdownOpen(false)}>
                  Face Shape Detector
                </DropdownItem>
                <DropdownItem href="/random-hairstyle-generator" onClick={() => setIsOtherToolsDropdownOpen(false)}>
                  Random Hairstyle Generator
                </DropdownItem>
                <DropdownItem href="/hair-type-identifier" onClick={() => setIsOtherToolsDropdownOpen(false)}>
                  Hair Type Identifier
                </DropdownItem>
                <DropdownItem href="/what-haircut-should-i-get" onClick={() => setIsOtherToolsDropdownOpen(false)}>
                  What Haircut Should I Get
                </DropdownItem>
              </DropdownMenu>
            </div>

            <NavLink href="/pricing" isActive={pathname === '/pricing'}>
              Pricing
            </NavLink>

            <ButtonSignin />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-700 hover:text-purple-700 transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200 overflow-y-auto max-h-[calc(100vh-4rem)]" data-mobile-menu>
              <Link href="/" className="block px-3 py-2 text-gray-700 hover:text-purple-700" onClick={(e) => { e.stopPropagation(); setIsMobileMenuOpen(false); }}>
                Home
              </Link>
              
              {/* Mobile Hairstyle Filter Dropdown */}
              <div className="border-b border-gray-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsHairstyleDropdownOpen(prev => !prev);
                    setIsColorDropdownOpen(false);
                  }}
                  className="flex items-center justify-between w-full px-3 py-2 text-gray-700 hover:text-purple-700"
                >
                  Hairstyle Filter
                  <svg 
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isHairstyleDropdownOpen ? 'rotate-180' : ''
                    }`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isHairstyleDropdownOpen && (
                  <div className="pl-6 pb-2 space-y-1">
                    <Link href="/hairstyles-for-girls" className="block px-3 py-1 text-sm text-gray-600 hover:text-purple-700" onClick={(e) => { e.stopPropagation(); setIsHairstyleDropdownOpen(false); setIsMobileMenuOpen(false); }}>
                      Girl Hairstyle Filter
                    </Link>
                    <Link href="/ai-hairstyle-male" className="block px-3 py-1 text-sm text-gray-600 hover:text-purple-700" onClick={(e) => { e.stopPropagation(); setIsHairstyleDropdownOpen(false); setIsMobileMenuOpen(false); }}>
                      Male Hairstyle Filter
                    </Link>
                    <Link href="/ai-hairstyle-online-free-female" className="block px-3 py-1 text-sm text-gray-600 hover:text-purple-700" onClick={(e) => { e.stopPropagation(); setIsHairstyleDropdownOpen(false); setIsMobileMenuOpen(false); }}>
                      Female Hairstyle Filter
                    </Link>
                    <Link href="/buzz-cut-filter" className="block px-3 py-1 text-sm text-gray-600 hover:text-purple-700" onClick={(e) => { e.stopPropagation(); setIsHairstyleDropdownOpen(false); setIsMobileMenuOpen(false); }}>
                      Buzz Cut Filter
                    </Link>
                    <Link href="/bob-haircut-filter" className="block px-3 py-1 text-sm text-gray-600 hover:text-purple-700" onClick={(e) => { e.stopPropagation(); setIsHairstyleDropdownOpen(false); setIsMobileMenuOpen(false); }}>
                      Bob Haircut Filter
                    </Link>
                    <Link href="/bangs-filter" className="block px-3 py-1 text-sm text-gray-600 hover:text-purple-700" onClick={(e) => { e.stopPropagation(); setIsHairstyleDropdownOpen(false); setIsMobileMenuOpen(false); }}>
                      Bangs Filter
                    </Link>
                    <Link href="/ai-braids-filter" className="block px-3 py-1 text-sm text-gray-600 hover:text-purple-700" onClick={(e) => { e.stopPropagation(); setIsHairstyleDropdownOpen(false); setIsMobileMenuOpen(false); }}>
                      Braids Filter
                    </Link>
                    <Link href="/perm-filter" className="block px-3 py-1 text-sm text-gray-600 hover:text-purple-700" onClick={(e) => { e.stopPropagation(); setIsHairstyleDropdownOpen(false); setIsMobileMenuOpen(false); }}>
                      Perm Filter
                    </Link>
                    <Link href="/pixie-cut-filter" className="block px-3 py-1 text-sm text-gray-600 hover:text-purple-700" onClick={(e) => { e.stopPropagation(); setIsHairstyleDropdownOpen(false); setIsMobileMenuOpen(false); }}>
                      Pixie Cut Filter
                    </Link>
                    <Link href="/short-hair-filter" className="block px-3 py-1 text-sm text-gray-600 hover:text-purple-700" onClick={(e) => { e.stopPropagation(); setIsHairstyleDropdownOpen(false); setIsMobileMenuOpen(false); }}>
                      Short Hair Filter
                    </Link>
                    <Link href="/long-hair-filter" className="block px-3 py-1 text-sm text-gray-600 hover:text-purple-700" onClick={(e) => { e.stopPropagation(); setIsHairstyleDropdownOpen(false); setIsMobileMenuOpen(false); }}>
                      Long Hair Filter
                    </Link>
                    <Link href="/man-bun-filter" className="block px-3 py-1 text-sm text-gray-600 hover:text-purple-700" onClick={(e) => { e.stopPropagation(); setIsHairstyleDropdownOpen(false); setIsMobileMenuOpen(false); }}>
                      Man Bun Filter
                    </Link>
                    <Link href="/undercut-filter" className="block px-3 py-1 text-sm text-gray-600 hover:text-purple-700" onClick={(e) => { e.stopPropagation(); setIsHairstyleDropdownOpen(false); setIsMobileMenuOpen(false); }}>
                      Undercut Filter
                    </Link>
                    <Link href="/pompadour-filter" className="block px-3 py-1 text-sm text-gray-600 hover:text-purple-700" onClick={(e) => { e.stopPropagation(); setIsHairstyleDropdownOpen(false); setIsMobileMenuOpen(false); }}>
                      Pompadour Filter
                    </Link>
                    <Link href="/textured-fringe-filter" className="block px-3 py-1 text-sm text-gray-600 hover:text-purple-700" onClick={(e) => { e.stopPropagation(); setIsHairstyleDropdownOpen(false); setIsMobileMenuOpen(false); }}>
                      Textured Fringe Filter
                    </Link>
                    <Link href="/low-fade-haircut-filter" className="block px-3 py-1 text-sm text-gray-600 hover:text-purple-700" onClick={(e) => { e.stopPropagation(); setIsHairstyleDropdownOpen(false); setIsMobileMenuOpen(false); }}>
                      Low Fade Filter
                    </Link>
                    <Link href="/dreadlocks-filter" className="block px-3 py-1 text-sm text-gray-600 hover:text-purple-700" onClick={(e) => { e.stopPropagation(); setIsHairstyleDropdownOpen(false); setIsMobileMenuOpen(false); }}>
                      Dreadlocks Filter
                    </Link>
                  </div>
                )}
              </div>

              {/* Mobile Hair Color Dropdown */}
              <div className="border-b border-gray-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsColorDropdownOpen(prev => !prev);
                    setIsHairstyleDropdownOpen(false);
                  }}
                  className="flex items-center justify-between w-full px-3 py-2 text-gray-700 hover:text-purple-700"
                >
                  Hair Color
                  <svg 
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isColorDropdownOpen ? 'rotate-180' : ''
                    }`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isColorDropdownOpen && (
                  <div className="pl-6 pb-2 space-y-1">
                       <Link href="/ai-hair-color-changer" className="block px-3 py-1 text-sm text-gray-600 hover:text-purple-700" onClick={(e) => { e.stopPropagation(); setIsColorDropdownOpen(false); setIsMobileMenuOpen(false); }}>
                      AI Hair Color Changer
                    </Link>
                    <Link href="/black-hair-filter" className="block px-3 py-1 text-sm text-gray-600 hover:text-purple-700" onClick={(e) => { e.stopPropagation(); setIsColorDropdownOpen(false); setIsMobileMenuOpen(false); }}>
                      Black Hair Filter
                    </Link>
                    <Link href="/blonde-hair-filter" className="block px-3 py-1 text-sm text-gray-600 hover:text-purple-700" onClick={(e) => { e.stopPropagation(); setIsColorDropdownOpen(false); setIsMobileMenuOpen(false); }}>
                      Blonde Hair Filter
                    </Link>
                    <Link href="/red-hair-filter" className="block px-3 py-1 text-sm text-gray-600 hover:text-purple-700" onClick={(e) => { e.stopPropagation(); setIsColorDropdownOpen(false); setIsMobileMenuOpen(false); }}>
                      Red Hair Filter
                    </Link>
                    <Link href="/white-hair-filter" className="block px-3 py-1 text-sm text-gray-600 hover:text-purple-700" onClick={(e) => { e.stopPropagation(); setIsColorDropdownOpen(false); setIsMobileMenuOpen(false); }}>
                      White Hair Filter
                    </Link>
                    <Link href="/gray-hair-filter" className="block px-3 py-1 text-sm text-gray-600 hover:text-purple-700" onClick={(e) => { e.stopPropagation(); setIsColorDropdownOpen(false); setIsMobileMenuOpen(false); }}>
                      Gray Hair Filter
                    </Link>
                    <Link href="/pink-hair-filter" className="block px-3 py-1 text-sm text-gray-600 hover:text-purple-700" onClick={(e) => { e.stopPropagation(); setIsColorDropdownOpen(false); setIsMobileMenuOpen(false); }}>
                      Pink Hair Filter
                    </Link>

                  </div>
                )}
              </div>

              {/* Mobile Other Tools Dropdown */}
              <div className="border-b border-gray-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOtherToolsDropdownOpen(prev => !prev);
                    setIsHairstyleDropdownOpen(false);
                    setIsColorDropdownOpen(false);
                  }}
                  className="flex items-center justify-between w-full px-3 py-2 text-gray-700 hover:text-purple-700"
                >
                  Other Tools
                  <svg 
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isOtherToolsDropdownOpen ? 'rotate-180' : ''
                    }`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isOtherToolsDropdownOpen && (
                  <div className="pl-6 pb-2 space-y-1">
                    <Link href="/face-shape-detector" className="block px-3 py-1 text-sm text-gray-600 hover:text-purple-700" onClick={(e) => { e.stopPropagation(); setIsOtherToolsDropdownOpen(false); setIsMobileMenuOpen(false); }}>
                      Face Shape Detector
                    </Link>
                    <Link href="/random-hairstyle-generator" className="block px-3 py-1 text-sm text-gray-600 hover:text-purple-700" onClick={(e) => { e.stopPropagation(); setIsOtherToolsDropdownOpen(false); setIsMobileMenuOpen(false); }}>
                      Random Hairstyle Generator
                    </Link>
                    <Link href="/hair-type-identifier" className="block px-3 py-1 text-sm text-gray-600 hover:text-purple-700" onClick={(e) => { e.stopPropagation(); setIsOtherToolsDropdownOpen(false); setIsMobileMenuOpen(false); }}>
                      Hair Type Identifier
                    </Link>
                    <Link href="/what-haircut-should-i-get" className="block px-3 py-1 text-sm text-gray-600 hover:text-purple-700" onClick={(e) => { e.stopPropagation(); setIsOtherToolsDropdownOpen(false); setIsMobileMenuOpen(false); }}>
                      What Haircut Should I Get
                    </Link>
                  </div>
                )}
              </div>

              <Link href="/pricing" className="block px-3 py-2 text-gray-700 hover:text-purple-700" onClick={(e) => { e.stopPropagation(); setIsMobileMenuOpen(false); }}>
                Pricing
              </Link>

              <div className="px-3 py-2">
                <ButtonSignin />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
} 