export interface GoFundMeAmount {
  amount: number
  currencyCode: string
}

export interface GoFundMeFundraiser {
  currentAmount: GoFundMeAmount
  goalAmount: GoFundMeAmount
  donationCount: number
  donationsEnabled: boolean
}

export interface GoFundMeResponse {
  data: {
    fundraiser: GoFundMeFundraiser
  }
}
