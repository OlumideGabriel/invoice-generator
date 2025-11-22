import requests
import time
import os

BREVO_API_KEY = os.getenv('BREVO_API_KEY')


class InvoiceEmailSender:
    def __init__(self, brevo_api_key=BREVO_API_KEY):
        self.brevo_api_key = brevo_api_key
        self.base_url = 'https://api.brevo.com/v3/smtp/email'

    def load_template(self, template_path='templates/invoice_email.html'):
        """Load and return the HTML email template"""
        try:
            with open(template_path, 'r') as f:
                return f.read()
        except FileNotFoundError:
            print(f"Template file not found: {template_path}")
            return self.get_fallback_template()
        except Exception as e:
            print(f"Error loading template: {e}")
            return self.get_fallback_template()

    def get_fallback_template(self):
        """Return a fallback template if the main template fails to load"""
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .invoice-header { background: #f8f9fa; padding: 20px; border-radius: 5px; }
                .invoice-details { margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="invoice-header">
                <h2>Invoice {{{INVOICE_NUMBER}}}</h2>
            </div>
            <div class="invoice-details">
                <p>Please find your invoice attached.</p>
            </div>
        </body>
        </html>
        """

    def fill_template(self, template_content, template_data):
        """Replace placeholders in template with actual data"""
        filled_content = template_content

        for key, value in template_data.items():
            placeholder = f"{{{{{key}}}}}"
            filled_content = filled_content.replace(placeholder, str(value))

        return filled_content

    def send_invoice_email(self, recipients, template_data, message='', attach_pdf=True, pdf_url=None):
        """
        Send invoice email via Brevo API

        Args:
            recipients: List of email addresses
            template_data: Dictionary with template variables
            message: Additional message to include in email
            attach_pdf: Whether to attach PDF
            pdf_url: URL of the PDF to attach

        Returns:
            dict: Response with success status and message
        """

        if not recipients:
            return {
                "success": False,
                "error": "No recipients provided"
            }

        # Merge and prepare template data
        template_data = template_data.copy()
        if 'INVOICE_NUMBER' not in template_data:
            template_data['INVOICE_NUMBER'] = f"INV-{int(time.time())}"

        # Load and fill template
        template_content = self.load_template()
        html_content = self.fill_template(template_content, template_data)

        # Add message if provided
        if message:
            html_content += f"<p>{message}</p>"

        # Prepare email payload
        email_payload = {
            "sender": {
                "name": "Envoyce",
                "email": "support@envoyce.com"
            },
            "to": [{"email": email} for email in recipients],
            "subject": f"Invoice #{template_data.get('INVOICE_NUMBER', '')}",
            "htmlContent": html_content
        }

        # Add attachment if requested
        if attach_pdf and pdf_url:
            email_payload["attachment"] = [
                {
                    "url": pdf_url,
                    "name": f"invoice-{template_data.get('INVOICE_NUMBER', 'invoice')}.pdf"
                }
            ]

        # Send email via Brevo API
        try:
            response = requests.post(
                self.base_url,
                headers={
                    'accept': 'application/json',
                    'content-type': 'application/json',
                    'api-key': self.brevo_api_key
                },
                json=email_payload,
                timeout=30  # 30 second timeout
            )

            if response.status_code == 201:
                return {
                    "success": True,
                    "message": f"Invoice sent successfully to {len(recipients)} recipient(s)",
                    "brevo_response": response.json()
                }
            else:
                return {
                    "success": False,
                    "error": f"Brevo API error: {response.status_code}",
                    "details": response.text
                }

        except requests.exceptions.RequestException as e:
            return {
                "success": False,
                "error": f"Request failed: {str(e)}"
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Unexpected error: {str(e)}"
            }


# Create a default instance for easy importing
invoice_sender = InvoiceEmailSender()


# Convenience function for quick usage
def send_invoice(recipients, template_data, message='', attach_pdf=True, pdf_url=None):
    """
    Convenience function to send invoice email quickly
    """
    return invoice_sender.send_invoice_email(
        recipients=recipients,
        template_data=template_data,
        message=message,
        attach_pdf=attach_pdf,
        pdf_url=pdf_url
    )