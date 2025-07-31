import "@stdlib/deploy";

// 定義參與者結構
struct Participant {
    address: Address;
    amount: Int;
    timestamp: Int;
}

// 定義抽獎結果結構
struct LotteryResult {
    winner: Address;
    nftId: Int;
    timestamp: Int;
}

// 主合約
contract CatLottery with Deployable {
    // === 狀態變量 ===
    owner: Address; // 合約擁有者
    nftContract: Address?; // NFT 合約地址
    entryFee: Int; // 參與費用 (nanoTON)
    maxParticipants: Int; // 最大參與人數
    lotteryActive: Bool; // 抽獎是否活躍
    currentRound: Int; // 當前輪次

    // 參與者資料
    participants: map<Int, Participant>; // 參與者映射
    participantCount: Int; // 參與者數量

    // 歷史記錄
    winners: map<Int, LotteryResult>; // 中獎記錄

    // === 初始化 ===
    init(owner: Address, entryFee: Int, maxParticipants: Int) {
        self.owner = owner;
        self.entryFee = entryFee;
        self.maxParticipants = maxParticipants;
        self.lotteryActive = true;
        self.currentRound = 1;
        self.participantCount = 0;
        self.nftContract = null;
    }

    // === 核心功能方法 ===

    // 參加抽獎
    receive("join") {
        // 1. 檢查抽獎是否活躍
        require(self.lotteryActive, "Lottery is not active");

        // 2. 檢查參與費用是否正確
        let msgValue: Int = context().value;
        require(msgValue >= self.entryFee, "Insufficient entry fee");

        // 3. 檢查是否達到最大參與人數
        require(self.participantCount < self.maxParticipants, "Maximum participants reached");

        // 4. 檢查是否重複參與（同一地址）
        let senderAddr: Address = sender();
        let i: Int = 0;
        while (i < self.participantCount) {
            let participant: Participant? = self.participants.get(i);
            if (participant != null) {
                require(participant!!.address != senderAddr, "Already participated in this round");
            }
            i = i + 1;
        }

        // 5. 儲存參與者資料
        let newParticipant: Participant = Participant {
            address: senderAddr,
            amount: msgValue,
            timestamp: now(),
        };

        self.participants.set(self.participantCount, newParticipant);
        self.participantCount = self.participantCount + 1;

        // 6. 發送參與成功事件
        emit(ParticipantJoined {
            participant: senderAddr,
            amount: msgValue,
            participantIndex: self.participantCount - 1,
            round: self.currentRound,
        }.toCell());

        // 7. 如果達到最大參與人數，自動停止接受新參與者
        if (self.participantCount >= self.maxParticipants) {
            self.lotteryActive = false;
            emit(LotteryFull { round: self.currentRound }.toCell());
        }
    }

    // 抽出中獎者（只有擁有者可以調用）
    receive("drawWinner") {
        // 1. 檢查調用者權限
        require(sender() == self.owner, "Only owner can draw winner");

        // 2. 檢查是否有參與者
        require(self.participantCount > 0, "No participants in current round");

        // 3. 使用時間戳和上下文資訊生成隨機數
        let randomSeed: Int = now();
        let gasFee: Int = context().readForwardFee();
        let combinedSeed: Int = randomSeed + gasFee + self.participantCount;

        // 4. 選出中獎者（使用取餘運算）
        let winnerIndex: Int = abs(combinedSeed) % self.participantCount;
        let winner: Participant? = self.participants.get(winnerIndex);

        require(winner != null, "Failed to get winner");
        let winnerParticipant: Participant = winner!!;

        // 5. 生成 NFT ID（基於輪次和隨機數）
        let nftId: Int = self.currentRound * 1000 + (abs(combinedSeed) % 100);

        // 6. 記錄中獎結果
        let lotteryResult: LotteryResult = LotteryResult {
            winner: winnerParticipant.address,
            nftId,
            timestamp: now(),
        };
        self.winners.set(self.currentRound, lotteryResult);

        // 7. 觸發 NFT 發送
        self.sendNFT(winnerParticipant.address, nftId);

        // 8. 發送中獎事件
        emit(WinnerDrawn {
            winner: winnerParticipant.address,
            nftId,
            round: self.currentRound,
            participantCount: self.participantCount,
        }.toCell());

        // 9. 重置抽獎狀態（準備下一輪）
        self.lotteryActive = false;
        // 清空參與者列表
        let i: Int = 0;
        while (i < self.participantCount) {
            self.participants.set(i, null);
            i = i + 1;
        }
        self.participantCount = 0;
    }

    // 發送 NFT 給中獎者
    fun sendNFT(winner: Address, nftId: Int) {
        // 1. 檢查 NFT 合約地址
        require(self.nftContract != null, "NFT contract not set");

        // 2. 準備 NFT 轉移訊息
        let nftTransferMsg: NFTTransfer = NFTTransfer {
            queryId: nftId,
            newOwner: winner,
            responseDestination: self.owner,
            customPayload: emptyCell(),
            forwardAmount: ton("0.01"),
            forwardPayload: emptySlice(),
        };

        // 3. 發送 NFT 轉移請求到 NFT 合約
        send(SendParameters {
            to: self.nftContract!!,
            value: ton("0.05"), // 支付 NFT 轉移的 gas 費用
            mode: SendPayGasSeparately,
            bounce: true,
            body: nftTransferMsg.toCell(),
        });

        // 4. 發送 NFT 發送事件
        emit(NFTSent {
            recipient: winner,
            nftId,
            nftContract: self.nftContract!!,
            timestamp: now(),
        }.toCell());
    }

    // === 管理功能 ===

    // 設定 NFT 合約地址
    receive(msg: SetNFTContract) {
        require(sender() == self.owner, "Only owner can set NFT contract");
        self.nftContract = msg.nftContract;
    }

    // 開始新一輪抽獎
    receive("startNewRound") {
        require(sender() == self.owner, "Only owner can start new round");
        require(!self.lotteryActive, "Current lottery is still active");

        self.lotteryActive = true;
        self.participantCount = 0;
        self.currentRound = self.currentRound + 1;
    }

    // 提取合約餘額
    receive("withdraw") {
        require(sender() == self.owner, "Only owner can withdraw");
        require(!self.lotteryActive, "Cannot withdraw during active lottery");

        let balance: Int = myBalance() - ton("0.1"); // 保留部署費用
        if (balance > 0) {
            send(SendParameters {
                to: self.owner,
                value: balance,
                mode: SendRemainingValue,
            });
        }
    }

    // === 查詢方法 ===

    // 獲取合約狀態
    get fun getContractInfo(): ContractInfo {
        return ContractInfo {
            owner: self.owner,
            entryFee: self.entryFee,
            maxParticipants: self.maxParticipants,
            currentRound: self.currentRound,
            lotteryActive: self.lotteryActive,
            participantCount: self.participantCount,
            nftContract: self.nftContract,
        };
    }

    // 獲取參與者資訊
    get fun getParticipant(index: Int): Participant? {
        return self.participants.get(index);
    }

    // 獲取中獎記錄
    get fun getWinner(round: Int): LotteryResult? {
        return self.winners.get(round);
    }

    // 獲取合約餘額
    get fun getBalance(): Int {
        return myBalance();
    }
}

// === 訊息結構定義 ===

// 設定 NFT 合約地址訊息
message SetNFTContract {
    nftContract: Address;
}

// NFT 轉移訊息（符合 TON NFT 標準）
message NFTTransfer {
    queryId: Int;
    newOwner: Address;
    responseDestination: Address;
    customPayload: Cell;
    forwardAmount: Int;
    forwardPayload: Slice;
}

// === 事件結構定義 ===

// 參與者加入事件
message ParticipantJoined {
    participant: Address;
    amount: Int;
    participantIndex: Int;
    round: Int;
}

// 抽獎滿員事件
message LotteryFull {
    round: Int;
}

// 中獎者抽出事件
message WinnerDrawn {
    winner: Address;
    nftId: Int;
    round: Int;
    participantCount: Int;
}

// NFT 發送事件
message NFTSent {
    recipient: Address;
    nftId: Int;
    nftContract: Address;
    timestamp: Int;
}

// === 查詢結構定義 ===

// 合約資訊結構
struct ContractInfo {
    owner: Address;
    entryFee: Int;
    maxParticipants: Int;
    currentRound: Int;
    lotteryActive: Bool;
    participantCount: Int;
    nftContract: Address?;
}
