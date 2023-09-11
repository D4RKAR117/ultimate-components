"use client";
import * as React from "react";

function SubButton(props: any) {
  return (
    <>
      <div>
        <button />

        <button className="active" />
      </div>
      <style jsx>{`
        button {
          color: aqua;
        }
        button.active {
          background-color: #000;
          color: #fff;
        }
      `}</style>
    </>
  );
}

export default SubButton;
