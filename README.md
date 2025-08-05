# 🚗 Automotive CRM Project with Salesforce

**Period**  
2025.06 ~ 2025.07

**Role**  
Developer, Administrator, Presenter

**Summary**  
청년CRM101 교육과정 중 수행한 프로젝트로 기아자동차를 모티브로 해서 CRM Motors라는 가상 기업에 세일즈포스로 비즈니스 솔루션을 도입했습니다. 자동차는 구매까지의 여정도 쉽지 않지만, 구매 이후 제품을 관리하는 여정 또한 상당한 노력이 들어가는 고관여 제품입니다. 이 프로젝트는 구매 전 시승 신청부터 구매 후 5년이 지난 시점까지 고객 여정의 범위를 비교적 넓게 설정했습니다. 시간상 모든 솔루션을 깊이 있게 다루긴 어렵더라도 전체 사이클을 직접 구현함으로써 차량이라는 제품의 CRM을 더 잘 이해해보는 것에 목적을 두었습니다.

Purchasing a car is a complex decision-making process, but the journey doesn’t end at the point of sales—**managing the product after purchase also requires significant effort**, making it a high-involvement product. During the Youth CRM101 training program, our project aimed to capture the full scope of the customer journey—**from pre-purchase test drive requests to post-purchase engagement even five years after the sales**. Rather than delving deeply into every individual issue, the goal was to **implement the full end-to-end cycle** ourselves. This allowed us to gain a more comprehensive understanding of how CRM can be effectively applied throughout the entire lifecycle of a vehicle.  

# Project Overview
**Part1.**  
시승 신청과 견적 기능으로 시작되는 여정은 스탠다드 오브젝트 기반의 Lead → Opportunity → Contract → Order → Asset 흐름으로 연결되며, 고객이 구매까지 거쳐온 여정과 수리 이력을 싱글뷰에서 볼 수 있는 고객360 화면을 구성했습니다.

**Part2.**  
정비 여정에서는 온라인 예약·진단·설문·재구매 유도까지의 Full Journey를 구축했으며, Knowledge 기반 응대와 재고 관리, 설문 자동화 등 고객 경험 중심의 서비스를 설계했습니다.

# Key Highlights based on my Contribution
(1) 정비 예약 시스템에서 예약 접수시 정비사 스킬 기반 자동 시간 제안
- 스탠다드 Service Scheduler Console 모델을 바탕으로 Custom으로 새로운 모델링 구현
  <img width="838" height="382" alt="crmotors_v6 drawio (1)" src="https://github.com/user-attachments/assets/72b7f778-d5f1-415f-94ec-223ff331dd46" />
- 고객이 접수한 정비유형(모터, 배터리 등)에 따라 해당 전문성을 보유한 정비사의 시간대만 접수 화면에 나타나도록 로직 구현
  https://github.com/user-attachments/assets/09aff8a3-fdaa-4d6e-89fc-0be63b17a1d4  

(2) 부품 재고율 관리 시스템
- 기준 재고 수량 대비 현재 부품 재고의 비율을 게이지로 보여주는 LWC 컴포넌트 구현
- 검색창에 부품의 '분류명'으로 검색시 관련 부품 리스트 즉시 조회 가능
- 특정 부품 재고율 10% 미만으로 업데이트 시 자동으로 정비사에게 알림 전송
  <img width="2377" height="1319" alt="image" src="https://github.com/user-attachments/assets/9c8b809e-dbcc-44af-a1d4-fba65e027ad4" />

# Why It Matters
In industries like automotive, CRM is not just about managing records—it’s about connecting fragmented processes to deliver unified and personalized customer experiences. This project reflects that mindset, and represents my first step toward becoming a Salesforce developer who understands not only the platform, but also the business context it operates within.
