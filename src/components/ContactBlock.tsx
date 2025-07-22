// src/components/ContactBlock.tsx
import { useEffect, useState } from 'react'

export const ContactBlock = () => {

  return (
    <>
      {/* ------------- CONTACTS ------------- */}
      <section id="contacts">
        <h2 className="section-title">Contacts and Resources</h2>
        <div id="contacts-content">
          <p>
            For a detailed list of HashJing contacts and resources, see the page&nbsp;
            <a
              href="https://datasattva.github.io/hashjing-res/"
              target="_blank"
              rel="noreferrer"
            >
              Contacts and Resources
            </a>
            .
          </p>
        </div>
      </section>
    </>
  );
}