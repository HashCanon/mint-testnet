// src/components/ContactBlock.tsx
import { useEffect, useState } from 'react'

export const ContactBlock = () => {
  return (
    <>
      {/* ------------- COMMUNITY & SUPPORT ------------- */}
      <section id="contacts">
        <h2 className="section-title">Community & Support</h2>
        <div id="contacts-content">
          <p>
            Questions, ideas or bug reports?{' '}
            <a
              href="https://github.com/DataSattva/hashjing/discussions"
              target="_blank"
              rel="noreferrer"
            >
              Join the discussion on GitHub
            </a>{' '}
            and let’s talk! 
            <br></br>
            For a detailed list of HashJing contacts and resources, see the page{' '}
            <a
              href="https://hashjing.github.io/resources/"
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