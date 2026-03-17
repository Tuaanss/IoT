import React from "react";
import { Figma, Github, Send } from "lucide-react";

export default function Profile() {
  return (
    <div>
      <div className="panel">
        <div className="panelInner">
          <div className="profileTop">
            <div className="avatar" />

            <div>
              <div className="profileName">Lê Việt Tuấn</div>
              <div className="profileMeta">B22DCPT247</div>
              <div className="profileMeta">IoT Dashboard Demo</div>
            </div>
          </div>
        </div>
      </div>

      <div className="profileCards">
        <div className="linkCard">
          <Figma size={18} /> Figma
        </div>
        <div className="linkCard">
          <Github size={18} /> Github
        </div>
        <div className="linkCard">
          <Send size={18} /> Postman
        </div>
      </div>
    </div>
  );
}


