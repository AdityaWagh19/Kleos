import boto3
import time

def setup_ec2():
    ec2 = boto3.client('ec2')
    ec2_resource = boto3.resource('ec2')

    # 1. Create Key Pair
    key_name = 'kleos-deploy-key'
    try:
        key_pair = ec2.create_key_pair(KeyName=key_name)
        private_key = key_pair['KeyMaterial']
        with open(f'{key_name}.pem', 'w') as file:
            file.write(private_key)
        print(f"Created Key Pair: {key_name}.pem (SAVE THIS FOR GITHUB SECRETS)")
    except ec2.exceptions.ClientError as e:
        if 'InvalidKeyPair.Duplicate' in str(e):
            print(f"Key Pair {key_name} already exists. We will reuse it.")
        else:
            raise e

    # 2. Create Security Group
    sg_name = 'kleos-web-sg'
    try:
        default_vpc = ec2.describe_vpcs(Filters=[{'Name': 'is-default', 'Values': ['true']}])['Vpcs'][0]
        vpc_id = default_vpc['VpcId']
        
        sg_response = ec2.create_security_group(
            GroupName=sg_name,
            Description='Kleos Web Security Group',
            VpcId=vpc_id
        )
        sg_id = sg_response['GroupId']
        print(f"Created Security Group {sg_id}")

        ec2.authorize_security_group_ingress(
            GroupId=sg_id,
            IpPermissions=[
                {'IpProtocol': 'tcp', 'FromPort': 22, 'ToPort': 22, 'IpRanges': [{'CidrIp': '0.0.0.0/0'}]},
                {'IpProtocol': 'tcp', 'FromPort': 80, 'ToPort': 80, 'IpRanges': [{'CidrIp': '0.0.0.0/0'}]},
                {'IpProtocol': 'tcp', 'FromPort': 443, 'ToPort': 443, 'IpRanges': [{'CidrIp': '0.0.0.0/0'}]}
            ]
        )
    except ec2.exceptions.ClientError as e:
        if 'InvalidGroup.Duplicate' in str(e):
            print(f"Security Group {sg_name} already exists. Fetching ID.")
            sg_id = ec2.describe_security_groups(GroupNames=[sg_name])['SecurityGroups'][0]['GroupId']
        else:
            raise e

    # 3. Get latest Ubuntu 24.04 AMI
    response = ec2.describe_images(
        Owners=['099720109477'], # Canonical
        Filters=[
            {'Name': 'name', 'Values': ['ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*']},
            {'Name': 'state', 'Values': ['available']}
        ]
    )
    images = sorted(response['Images'], key=lambda x: x['CreationDate'], reverse=True)
    ami_id = images[0]['ImageId']
    print(f"Using Ubuntu 24.04 AMI: {ami_id}")

    # 4. User Data (Install Docker & Docker Compose)
    user_data = '''#!/bin/bash
apt-get update
apt-get install -y ca-certificates curl
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
usermod -aG docker ubuntu
systemctl enable docker
systemctl start docker
'''

    # 5. Launch Instance
    print("Launching EC2 Instance...")
    instances = ec2_resource.create_instances(
        ImageId=ami_id,
        InstanceType='t3.small',
        KeyName=key_name,
        MaxCount=1,
        MinCount=1,
        SecurityGroupIds=[sg_id],
        UserData=user_data,
        TagSpecifications=[{'ResourceType': 'instance', 'Tags': [{'Key': 'Name', 'Value': 'Kleos-Server'}]}]
    )
    
    instance = instances[0]
    print(f"Waiting for instance {instance.id} to be running...")
    instance.wait_until_running()
    instance.reload()
    print(f"\n--- SUCCESS ---")
    print(f"Instance ID: {instance.id}")
    print(f"Public IP: {instance.public_ip_address}")
    print(f"Connect: ssh -i {key_name}.pem ubuntu@{instance.public_ip_address}")

if __name__ == '__main__':
    setup_ec2()
