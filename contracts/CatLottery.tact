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
    drawInProgress: Bool; // 抽獎是否正在進行中
    drawStartTime: Int; // 抽獎開始時間戳
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
        self.drawInProgress = false;
        self.drawStartTime = 0;
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

        // 3. 檢查是否已經在抽獎中或已經抽過獎
        require(!self.drawInProgress, "Draw is already in progress");
        let existingWinner: LotteryResult? = self.winners.get(self.currentRound);
        require(existingWinner == null, "Lottery already drawn for this round");

        // 4. 標記抽獎開始，防止重複執行
        self.drawInProgress = true;
        self.drawStartTime = now();

        // 5. 使用時間戳和上下文資訊生成隨機數
        let randomSeed: Int = now();
        let gasFee: Int = context().readForwardFee();
        let combinedSeed: Int = randomSeed + gasFee + self.participantCount;

        // 6. 選出中獎者（使用取餘運算）
        let winnerIndex: Int = abs(combinedSeed) % self.participantCount;
        let winner: Participant? = self.participants.get(winnerIndex);

        require(winner != null, "Failed to get winner");
        let winnerParticipant: Participant = winner!!;

        // 7. 生成 NFT ID（基於輪次和隨機數）
        let nftId: Int = self.currentRound * 1000 + (abs(combinedSeed) % 100);

        // 8. 觸發 NFT 發送 - 使用 bounce: false 避免交易回滾
        self.sendNFTAndFinalize(winnerParticipant.address, nftId);
    }

    // 發送 NFT 並完成抽獎流程
    fun sendNFTAndFinalize(winner: Address, nftId: Int) {
        // 1. 檢查 NFT 合約地址
        require(self.nftContract != null, "NFT contract not set");

        // 2. 準備特殊的 MintToAndNotify 訊息，包含回調資訊
        let mintMsg: MintToAndNotify = MintToAndNotify {
            to: winner,
            nftId: nftId,
            lotteryContract: myAddress(),
            round: self.currentRound,
        };

        // 3. 發送 MintTo 請求到 NFT 合約，使用 bounce: false 避免交易失敗
        send(SendParameters {
            to: self.nftContract!!,
            value: ton("0.15"), // 增加 gas 費用以支付回調交易
            mode: SendPayGasSeparately,
            bounce: false, // 關鍵：避免交易回滾
            body: mintMsg.toCell(),
        });

        // 4. 發送 NFT 發送開始事件
        emit(NFTMintStarted {
            recipient: winner,
            nftId,
            nftContract: self.nftContract!!,
            round: self.currentRound,
            timestamp: now(),
        }.toCell());
    }

    // 接收來自 NFT 合約的成功通知
    receive(msg: NFTMintSuccess) {
        // 1. 驗證發送者是 NFT 合約
        require(sender() == self.nftContract, "Only NFT contract can confirm mint");

        // 2. 記錄中獎結果
        let lotteryResult: LotteryResult = LotteryResult {
            winner: msg.recipient,
            nftId: msg.nftId,
            timestamp: now(),
        };
        self.winners.set(msg.round, lotteryResult);

        // 3. 發送中獎確認事件
        emit(WinnerConfirmed {
            winner: msg.recipient,
            nftId: msg.nftId,
            round: msg.round,
            participantCount: self.participantCount,
        }.toCell());

        // 4. 重置抽獎進行狀態
        self.drawInProgress = false;
        self.drawStartTime = 0;

        // 5. 自動開始新輪次
        self.autoStartNewRound();
    }

    // 發送 NFT 給中獎者（保留原方法以向後相容）
    fun sendNFT(winner: Address, nftId: Int) {
        // 1. 檢查 NFT 合約地址
        require(self.nftContract != null, "NFT contract not set");

        // 2. 準備 MintTo 訊息給 CatNFT 合約
        let mintMsg: MintTo = MintTo {
            to: winner,
        };

        // 3. 發送 MintTo 請求到 NFT 合約
        send(SendParameters {
            to: self.nftContract!!,
            value: ton("0.1"), // 增加 gas 費用以支付 NFT 鑄造和通知
            mode: SendPayGasSeparately,
            bounce: false, // 修改：避免交易回滾
            body: mintMsg.toCell(),
        });

        // 4. 發送 NFT 發送事件
        emit(NFTSent {
            recipient: winner,
            nftId,
            nftContract: self.nftContract!!,
            timestamp: now(),
        }.toCell());
    }

    // 自動開始新輪次（內部方法）
    fun autoStartNewRound() {
        // 清空參與者列表
        let i: Int = 0;
        while (i < self.participantCount) {
            self.participants.set(i, null);
            i = i + 1;
        }
        
        // 重置狀態並開始新輪次
        self.participantCount = 0;
        self.currentRound = self.currentRound + 1;
        self.lotteryActive = true;
        
        // 發送新輪次開始事件
        emit(NewRoundStarted {
            round: self.currentRound,
            timestamp: now(),
        }.toCell());
    }

    // 根據模板 ID 獲取貓咪名稱
    fun getCatNameByTemplate(templateId: Int): String {
        if (templateId == 0) {
            return "Tabby";
        } else if (templateId == 1) {
            return "Siamese Princess";
        } else if (templateId == 2) {
            return "Maine Coon King";
        } else {
            return "Cosmic Cat";
        }
    }

    // === 管理功能 ===

    // 設定 NFT 合約地址
    receive(msg: SetNFTContract) {
        require(sender() == self.owner, "Only owner can set NFT contract");
        self.nftContract = msg.nftContract;
    }

    // 手動開始新一輪抽獎（緊急情況下使用）
    receive("startNewRound") {
        require(sender() == self.owner, "Only owner can start new round");
        require(!self.lotteryActive, "Current lottery is still active");

        // 手動呼叫自動開始新輪次函數
        self.autoStartNewRound();
    }

    // 重置抽獎狀態（當 NFT 鑄造失敗時的緊急恢復）
    receive("resetDrawState") {
        require(sender() == self.owner, "Only owner can reset draw state");
        require(self.drawInProgress, "No draw in progress to reset");
        
        // 檢查是否真的沒有中獎記錄（確認失敗）
        let existingWinner: LotteryResult? = self.winners.get(self.currentRound);
        require(existingWinner == null, "Draw has already completed successfully");
        
        // 可選：檢查是否超時（5分鐘 = 300秒）
        let timeoutDuration: Int = 300;
        let timePassed: Int = now() - self.drawStartTime;
        if (timePassed < timeoutDuration) {
            // 如果沒超時，只允許 owner 重置
            // 已經在上面檢查過 owner 權限了
        }
        
        // 重置狀態，允許重新抽獎
        self.drawInProgress = false;
        self.drawStartTime = 0;
        
        emit(DrawStateReset {
            round: self.currentRound,
            timestamp: now(),
        }.toCell());
    }

    // 任何人都可以在超時後重置（公開安全機制）
    receive("resetDrawStateIfTimeout") {
        require(self.drawInProgress, "No draw in progress");
        
        // 檢查是否超時（5分鐘）
        let timeoutDuration: Int = 300;
        let timePassed: Int = now() - self.drawStartTime;
        require(timePassed >= timeoutDuration, "Draw has not timed out yet");
        
        // 檢查是否真的沒有中獎記錄（確認失敗）
        let existingWinner: LotteryResult? = self.winners.get(self.currentRound);
        require(existingWinner == null, "Draw has already completed successfully");
        
        // 重置狀態
        self.drawInProgress = false;
        self.drawStartTime = 0;
        
        emit(DrawStateReset {
            round: self.currentRound,
            timestamp: now(),
        }.toCell());
    }

    // 暫停抽獎（用於維護或提取資金）
    receive("pauseLottery") {
        require(sender() == self.owner, "Only owner can pause lottery");
        require(self.lotteryActive, "Lottery is already inactive");
        
        self.lotteryActive = false;
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
            drawInProgress: self.drawInProgress,
            drawStartTime: self.drawStartTime,
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

// NFT 鑄造訊息（發送給簡化 NFT 合約）
message MintTo {
    to: Address;
}

// NFT 鑄造並通知訊息（包含回調資訊）
message MintToAndNotify {
    to: Address;
    nftId: Int;
    lotteryContract: Address;
    round: Int;
}

// NFT 鑄造成功通知（NFT 合約回傳）
message NFTMintSuccess {
    recipient: Address;
    nftId: Int;
    round: Int;
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

// NFT 鑄造開始事件
message NFTMintStarted {
    recipient: Address;
    nftId: Int;
    nftContract: Address;
    round: Int;
    timestamp: Int;
}

// 中獎者確認事件（NFT 鑄造成功後）
message WinnerConfirmed {
    winner: Address;
    nftId: Int;
    round: Int;
    participantCount: Int;
}

// 新輪次開始事件
message NewRoundStarted {
    round: Int;
    timestamp: Int;
}

// 抽獎狀態重置事件
message DrawStateReset {
    round: Int;
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
    drawInProgress: Bool;
    drawStartTime: Int;
    participantCount: Int;
    nftContract: Address?;
}
