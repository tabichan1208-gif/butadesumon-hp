export type EmailSettings = {
  customer_email_enabled:boolean;
  customer_subject:string;
  customer_body:string;
  store_email_enabled:boolean;
  store_notification_email:string;
  store_subject:string;
  store_body:string;
};

export const defaultEmailSettings:EmailSettings={
  customer_email_enabled:false,
  customer_subject:"【豚ですもん。】ご予約を受け付けました",
  customer_body:`{{お名前}} 様

豚ですもん。へご予約いただき、ありがとうございます。
以下の内容でご予約を受け付けました。

来店日：{{来店日}}
開始時間：{{開始時間}}
利用時間：{{利用時間}}
人数：{{人数}}
駐車場：{{駐車場}}
備考：{{備考}}

ご来店を心よりお待ちしております。`,
  store_email_enabled:false,
  store_notification_email:"",
  store_subject:"【新規予約】{{来店日}} {{開始時間}}／{{お名前}} 様",
  store_body:`ホームページから新しい予約が入りました。

受付番号：{{予約番号}}
来店日：{{来店日}}
開始時間：{{開始時間}}
利用時間：{{利用時間}}
お名前：{{お名前}}
電話番号：{{電話番号}}
メール：{{メール}}
人数：{{人数}}
駐車場：{{駐車場}}
備考：{{備考}}`
};
