export type PricingSettings={heading:string;description:string;note:string;published:boolean};
export type PricingItem={id:string;label:string;price:string;description:string|null;sort_order:number;published:boolean};

export const defaultPricingSettings:PricingSettings={
  heading:"ご利用料金",
  description:"こぶたちゃんたちと過ごす、やさしいひとときをお楽しみください。",
  note:"料金は当日、店舗にてお支払いください。",
  published:false
};
