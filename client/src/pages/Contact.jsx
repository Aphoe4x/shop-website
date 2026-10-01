function Contact() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>Contact Us</h1>
          <p>We'd love to hear from you</p>
        </div>
      </section>
      <div className="contact-content">
        <div className="contact-info">
          <p><strong>Email:</strong> abdulbasitafolabi7@gmail.com</p>
          <p><strong>Phone:</strong> +234 800 000 0000</p>
          <p><strong>Address:</strong> Lagos, Nigeria</p>
          <p><strong>Hours:</strong> Mon - Fri, 9am - 6pm WAT</p>
        </div>

        <form onSubmit={(e) => e.preventDefault()} className="checkout-form">
          <h2>Send us a message</h2>
          <div className="form-group">
            <label>Your Name</label>
            <input type="text" placeholder="Enter your name" required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" placeholder="Enter your email" required />
          </div>
          <div className="form-group">
            <label>Subject</label>
            <input type="text" placeholder="What's this about?" required />
          </div>
          <div className="form-group">
            <label>Message</label>
            <textarea rows="5" placeholder="Type your message here..." required></textarea>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Send Message
          </button>
        </form>
      </div>
    </>
  );
}

export default Contact;
