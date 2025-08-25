"use client";

export default function ScrollToTopButton() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      onClick={scrollToTop}
      className="btn bg-purple-700 text-white btn-lg rounded-xl"
    >
      Try AI Hairstyle Changer Now
    </button>
  );
}