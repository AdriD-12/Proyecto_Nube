# IS727272 - EC2 configuration

# Install dependencies
sudo dnf --assumeyes install git
sudo dnf --assumeyes install npm

# Create application container directory
mkdir /home/ec2-user/app
cd /home/ec2-user/app

# Fetch remote repository
git init
git remote add -f origin git@github.com:Marcox385/Cloud_O2023.git
git config core.sparseCheckout true
echo "Project/" >> .git/info/sparse-checkout
git pull origin main
