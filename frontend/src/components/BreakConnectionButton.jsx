import { useState } from "react";
import { useNavigate } from "react-router-dom";

const BreakConnectionButton = ({
  message,
  buttonText = "Break Connection",
  theme = "signal", // 'signal', 'digital', 'circuit'
}) => {
  const [showPopup, setShowPopup] = useState(false);
  const navigate = useNavigate();

  const handleClick = () => setShowPopup(true);

  const handleConfirm = () => {
    localStorage.removeItem("team");
    localStorage.removeItem("activeSection");
    navigate("/");
  };

  const handleCancel = () => setShowPopup(false);

  // Theme-based color mapping
  const themeColors = {
    signal: { title: "#00FFF5", text: "#B2FFFF", bg: "#111111" }, // Cyan-ish for Grid 1
    digital: { title: "#00FF80", text: "#B2FFCC", bg: "#0A0A0A" }, // Green-ish for Grid 2
    circuit: { title: "#FFDD00", text: "#FFF5B2", bg: "#111100" }, // Yellow-ish for Grid 3
  };

  const colors = themeColors[theme] || themeColors.signal;

  return (
    <>
      <button
        onClick={handleClick}
        className={`px-4 py-2 rounded-lg bg-gradient-to-br from-black to-gray-900 border-2 border-red-700 text-red-500 transition-all duration-200`}
      >
        {buttonText}
      </button>

      {showPopup && (
        <div
          className="fixed inset-0 flex justify-center items-center z-50"
          style={{ backgroundColor: "rgba(0,0,0,0.75)", animation: "fadeIn 0.3s ease-out" }}
        >
          <div
            className="p-6 rounded-xl max-w-sm text-center border shadow-lg"
            style={{
              backgroundColor: colors.bg,
              borderColor: colors.text,
              animation: "scaleIn 0.3s ease-out",
            }}
          >
            <h2 className="text-xl font-bold mb-4" style={{ color: colors.title, textShadow: "0 0 8px rgba(0,255,255,0.5)" }}>
              Keep the ElectroMatrix Alive!
            </h2>
            <p className="mb-6" style={{ color: colors.text }}>
              {message || "Each attempt rebuilds the lost circuits. Take a breath, and try again."}
            </p>
            <div className="flex justify-around">
              <button
                onClick={handleConfirm}
                className="px-4 py-2 rounded-lg font-semibold transition"
                style={{ backgroundColor: colors.title, color: "#000" }}
              >
                Proceed
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 rounded-lg bg-gray-700 text-gray-200 hover:bg-gray-600 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.85); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default BreakConnectionButton;
