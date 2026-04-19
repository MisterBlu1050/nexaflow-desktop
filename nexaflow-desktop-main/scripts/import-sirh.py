#!/usr/bin/env python3
import pandas as pd
import sqlite3
import re

def clean_salary(v):
    s = str(v)
    digits = re.sub(r"[^\d]", "", s)
    return int(digits) if digits else None

def main():
    # Charger le SIRH (sheet name may vary)
    df = pd.read_excel("NexaFlow_SIRH_500.xlsx", sheet_name="Employés")

    # Nettoyer la colonne salaire (€95,000 -> 95000)
    df["salaire"] = df["Salaire brut annuel"].apply(clean_salary)

    # Renommer les colonnes
    df = df.rename(columns={
        "ID": "id",
        "Nom": "nom",
        "Fonction": "fonction",
        "Département": "departement",
        "Sous-équipe": "sous_equipe",
        "Date embauche": "date_embauche",
        "Ancienneté (ans)": "anciennete",
        "Contrat": "contrat",
        "Régime": "regime",
        "Lieu": "lieu",
        "Langue(s)": "langues",
        "Genre": "genre",
        "Âge": "age",
        "Manager": "manager",
        "Éval. performance": "eval_perf",
        "Risque départ": "risque_depart"
    })

    # Colonnes utiles
    colonnes = ["id","nom","fonction","departement","sous_equipe",
                "date_embauche","anciennete","contrat","regime",
                "lieu","salaire","langues","genre","age",
                "manager","eval_perf","risque_depart"]
    df = df[[c for c in colonnes if c in df.columns]]

    # Créer la DB
    conn = sqlite3.connect("nexaflow.db")
    df.to_sql("employes", conn, if_exists="replace", index=False)

    # Index utiles
    conn.execute("CREATE INDEX IF NOT EXISTS idx_dept ON employes(departement)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_lieu ON employes(lieu)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_risque ON employes(risque_depart)")
    conn.commit()
    conn.close()

    print(f"✅ {len(df)} employés importés dans nexaflow.db")

if __name__ == '__main__':
    main()
