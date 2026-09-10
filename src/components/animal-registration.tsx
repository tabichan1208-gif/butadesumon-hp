import { registrationEntries } from "@/lib/animal-registrations";
import { Fragment } from "react";
import type { SiteSettings } from "@/lib/site-content";

export function AnimalRegistration({settings}:{settings:SiteSettings}) {
  if (!settings.animal_registration_published) return null;
  const entries=registrationEntries(settings);
  if(!entries.length || entries.some(row=>!row.type.trim()||!row.number.trim())) return null;
  const rows = [
    ["登録者の氏名または名称", settings.animal_registrant],
    ["事業所の名称", settings.animal_business_name],
    ["事業所の所在地", settings.animal_business_address],
    ["登録年月日", settings.animal_registration_date],
    ["有効期間の末日", settings.animal_registration_expiry],
    ["動物取扱責任者氏名", settings.animal_responsible_person],
  ];
  if (rows.some(([,value])=>!value?.trim())) return null;
  return <section className="animal-registration" aria-labelledby="animal-registration-heading">
    <h2 id="animal-registration-heading">第一種動物取扱業の登録情報</h2>
    <dl>{rows.map(([label,value])=><Fragment key={label}><dt>{label}</dt><dd>{value}</dd></Fragment>)}</dl>
    <table className="registration-table"><caption>種別ごとの登録番号</caption><thead><tr><th scope="col">種別</th><th scope="col">登録番号</th></tr></thead><tbody>{entries.map((entry,index)=><tr key={index}><td>{entry.type}</td><td>{entry.number}</td></tr>)}</tbody></table>
  </section>;
}
