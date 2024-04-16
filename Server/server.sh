# Configuración EC2

# Instalar dependencias
sudo dnf --assumeyes install git
sudo dnf --assumeyes install npm

# Crear container de aplicación
mkdir /home/ec2-user/app
cd /home/ec2-user/app

# Obtener cambio de repositorio
git init
git remote add origin git@github.com:AdriD-12/Proyecto_Nube.git
git pull origin main
