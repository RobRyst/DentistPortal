import { useEffect } from "react";

export default function NoupeChatbot() {
  useEffect(() => {
    const scriptId = "noupe-chatbot-script";
    if (document.getElementById(scriptId)) return;

    const script = document.createElement("script");
    script.id = scriptId;
    script.src =
      "https://www.noupe.com/embed/0199e9614c507f129e417decb705b0c02814.js";
    script.async = true;

    document.body.appendChild(script);

    return () => {
      const existing = document.getElementById(scriptId);
      if (existing) {
        existing.remove();
      }
    };
  }, []);

  return null;
}
