// src/components/ContactBlock.tsx
export const ContactBlock = () => {
  return (
    <section className="space-y-4 mt-10 pb-8">
      <h2 className="text-center text-2xl font-semibold tracking-tight">
        Community & Support
      </h2>

      <p className="text-base leading-relaxed">
        Questions, ideas or bug reports?{" "}
        <a
          href="https://github.com/DataSattva/hashjing/discussions"
          target="_blank"
          rel="noreferrer"
          className="text-blue-400 underline hover:text-blue-600"
        >
          Join the discussion on GitHub
        </a>{" "}
        and let’s talk!
        <br></br>
        For a detailed list of HashJing contacts and resources, see the page{" "}
        <a
          href="https://hashjing.github.io/resources/"
          target="_blank"
          rel="noreferrer"
          className="text-blue-400 underline hover:text-blue-600"
        >
          Contacts and Resources
        </a>
        .
      </p>
    </section>
  )
}
