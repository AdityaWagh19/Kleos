import paramiko
import time

def run_ssh_command(ssh, command):
    print(f"Executing: {command}")
    stdin, stdout, stderr = ssh.exec_command(command)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8')
    err = stderr.read().decode('utf-8')
    
    if out:
        print(f"STDOUT:\n{out}")
    if err:
        print(f"STDERR:\n{err}")
    
    if exit_status != 0:
        print(f"Command failed with exit status {exit_status}")
    return exit_status == 0

def setup_ssl():
    key = paramiko.RSAKey.from_private_key_file("kleos-deploy-key.pem")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    print("Connecting to EC2...")
    ssh.connect(hostname="52.38.55.235", username="ubuntu", pkey=key)
    
    print("Connected. Setting up Let's Encrypt...")
    
    # Create the webroot folder
    run_ssh_command(ssh, "sudo mkdir -p /var/www/certbot")
    run_ssh_command(ssh, "sudo chown -R ubuntu:ubuntu /var/www/certbot")
    
    # Install certbot
    run_ssh_command(ssh, "sudo snap install core; sudo snap refresh core")
    run_ssh_command(ssh, "sudo snap install --classic certbot")
    run_ssh_command(ssh, "sudo ln -sf /snap/bin/certbot /usr/bin/certbot")
    
    # Stop running containers to free port 80 for standalone verification
    run_ssh_command(ssh, "cd ~/kleos && docker compose -f docker-compose.prod.yml down")
    
    # Get the certificate using standalone mode for the first time
    domain = "kleos-ai.duckdns.org"
    email = "admin@kleos-ai.duckdns.org"
    
    print("Requesting certificate...")
    # Standalone mode spins up its own temporary webserver on port 80 to verify domain
    cert_command = f"sudo certbot certonly --standalone -d {domain} --non-interactive --agree-tos -m {email}"
    success = run_ssh_command(ssh, cert_command)
    
    if success:
        print("--- CERTIFICATE ACQUIRED SUCCESSFULLY ---")
    else:
        print("--- FAILED TO ACQUIRE CERTIFICATE ---")
        
    ssh.close()

if __name__ == "__main__":
    setup_ssl()
