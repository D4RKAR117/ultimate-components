"use client";
import * as React from "react";
import SubButton from "@components/SubButton/sub-button";

function Button(props: any) {
  return (
    <>
      <div>
        <button />

        <button className="active" />

        <SubButton />
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

export default Button;
