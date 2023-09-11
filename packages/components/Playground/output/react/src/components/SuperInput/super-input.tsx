"use client";
import * as React from "react";

interface Props {
  name: string;
  label: string;
  value: string;
  onUpdateValue: (val: string) => void;
  errorMessage?: string;
}

function SuperInputField(props: Props) {
  return (
    <>
      <div className="my-super-duper-input-field">
        <label htmlFor={props.name}>{props.label}</label>

        <input
          id={props.name}
          name={props.name}
          value={props.value}
          onChange={(event) => props.onUpdateValue(event.target.value)}
        />

        {props.errorMessage ? (
          <>
            <p className="form-message danger">{props.errorMessage}</p>
          </>
        ) : null}
      </div>
      <style jsx>{``}</style>
    </>
  );
}

export default SuperInputField;
