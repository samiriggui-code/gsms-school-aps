# Déploiement production — repo **gsms-school-final** uniquement

> Ancien repo `gsms-school` : **ne plus utiliser**.

## URLs

| Service | URL |
|---------|-----|
| App LMS | https://hosting-global-it-ss.com |
| Monitoring | https://monitoring.hosting-global-it-ss.com |

## Repo Git

```
git@github.com:samiriggui-code/gsms-school-final.git
```

Remote local : `final` → `git push final main`

## Premier déploiement (VPS)

```bash
# 1. Clé SSH deploy sur le VPS (Settings GitHub → Deploy keys)
ssh-keygen -t ed25519 -f ~/.ssh/github_gsms_final -N ""
cat ~/.ssh/github_gsms_final.pub   # à coller sur GitHub gsms-school-final

# 2. ~/.ssh/config
Host github.com
  IdentityFile ~/.ssh/github_gsms_final

# 3. Env prod (hors Git)
mkdir -p /opt/gsms
# copier deploy/gsms/.env → /opt/gsms/.env
chmod 600 /opt/gsms/.env

# 4. Install
git clone git@github.com:samiriggui-code/gsms-school-final.git /opt/gsms-school
bash /opt/gsms-school/deploy/gsms/install.sh
```

## Mise à jour (depuis ton PC)

```powershell
git push final main
.\scripts\vps-git-deploy.ps1 -SkipPush   # si déjà pushé
```

Ou sur le VPS :

```bash
cd /opt/gsms-school && git pull origin main && bash deploy/gsms/deploy.sh
```
