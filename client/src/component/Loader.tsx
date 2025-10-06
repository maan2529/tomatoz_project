import React from "react";
import "./Loader.css";

const Loader: React.FC = () => (
  <div className="loader-container">
    <div className="spinner" />
    <p>Loading...</p>
  </div>
);

export default Loader;
